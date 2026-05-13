"use client";
import React, { useEffect, useState, useCallback, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ViewRecordModal, EditRecordModal, TransferPatientModal, ViewPrescriptionModal } from "./modals";
import NotificationBell from "@/components/NotificationBell";
import SupportModal from "@/components/SupportModal";
import { BookingWizard } from "@/components/AppointmentPanel";
import Preloader from "@/components/Preloader";
import {
  ResponsiveContainer as RechartsResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area as RechartsArea,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  Tooltip as RechartsTooltip,
  PieChart as RechartsPieChart,
  Pie as RechartsPie,
  Cell as RechartsCell,
  ComposedChart as RechartsComposedChart,
  BarChart as RechartsBarChart,
  Bar as RechartsBar,
  Line as RechartsLine,
} from "recharts";

import {
  LogOut, Loader2, Bell, User, Phone, Mail, Activity, LayoutDashboard, Truck,
  Layers, ArrowRight, CheckCircle, Clock, Stethoscope, Settings,
  Users, ClipboardList, Building2, Search, RefreshCw, X, ChevronRight,
  Smile, Sparkles, Wand2, Scissors, Heart, Microscope, Pill, Receipt, Scan,
  TestTube2, HelpCircle, PlayCircle, CheckCircle2, AlertCircle,
  CalendarDays, FileText, TrendingUp, TrendingDown, FlaskConical,
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight, DollarSign, IndianRupee,
  Save, Ban, ChevronDown, ChevronUp, MessageSquare, UserCheck, Eye, Download,
  ShieldCheck, BarChart2, Package, UserPlus, ArrowUpDown, FileSpreadsheet,
  FileType, AlertTriangle, Bed, CreditCard, Menu, ShoppingCart
} from "lucide-react";

const BillingQueueLazy = dynamic(() => import("@/components/BillingQueue"), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading Billing Queue...</span></div> });
const AppointmentPanelLazy = dynamic(() => import("@/components/AppointmentPanel"), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading Appointments...</span></div> });
const PatientsManagementPanelLazy = dynamic(() => import("./PatientsManagementPanel").then(mod => mod.PatientsManagementPanel), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading Patient Management...</span></div> });
const AdminInventoryPanelLazy = dynamic(() => import("@/components/AdminInventoryPanel"), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading Inventory...</span></div> });
const DoctorPanelLazy = dynamic(() => import("@/components/DoctorPanel"), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading Doctors...</span></div> });
const PharmacyDashboardLazy = dynamic(() => import("@/components/PharmacyDashboard"), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading Pharmacy Dashboard...</span></div> });
const NursingDashboardLazy = dynamic(() => import("@/components/NursingDashboard"), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading Nursing Dashboard...</span></div> });
const HousekeepingDashboardLazy = dynamic(() => import("@/components/HousekeepingDashboard"), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading Housekeeping Dashboard...</span></div> });
const AmbulanceDashboardLazy = dynamic(() => import("@/components/AmbulanceDashboard"), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading Ambulance Dashboard...</span></div> });
const BiomedicalDashboardLazy = dynamic(() => import("@/components/BiomedicalDashboard"), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading Biomedical Dashboard...</span></div> });
const LabDashboardLazy = dynamic<{ profile: any; user: any; activeTab?: string; onTabChange?: (t: string) => void }>(() => import("@/components/LabDashboard"), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading Lab Dashboard...</span></div> });
const CriticalCareDashboardLazy = dynamic<{ profile: any; user: any; activeTab?: string; onTabChange?: (t: string) => void }>(() => import("@/components/CriticalCareDashboard"), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading Critical Care Dashboard...</span></div> });
const SpecialtyClinicDashboardLazy = dynamic<{ profile: any; user: any; activeTab?: string; onTabChange?: (t: string) => void }>(() => import("@/components/SpecialtyClinicDashboard"), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading Specialty Dashboard...</span></div> });
const DentalOPDDashboardLazy = dynamic<{ profile: any; user: any; activeTab?: string; onTabChange?: (t: string) => void; meta: any }>(() => import("@/components/DentalOPDDashboard"), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading Dental OPD Dashboard...</span></div> });
const OPDDashboardLazy = dynamic<{ profile: any; user: any; activeTab?: string; onTabChange?: (t: string) => void; meta: any }>(() => import("@/components/OPDDashboard"), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading OPD Dashboard...</span></div> });
const PathologyDashboardLazy = dynamic<{ profile: any; user: any; activeTab?: string; onTabChange?: (t: string) => void }>(() => import("@/components/PathologyDashboard"), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading Pathology Dashboard...</span></div> });
const BillingDepartmentDashboardLazy = dynamic<{ profile: any; user: any; activeTab: string; onTabChange: (t: string) => void; meta: any }>(() => import("@/components/BillingDepartmentDashboard"), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading Billing Dashboard...</span></div> });
const AccountSettingsPanelLazy = dynamic<{ user: any }>(() => import("@/components/AccountSettingsPanel"), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading Account Settings...</span></div> });
const HRDepartmentDashboardLazy = dynamic<{ profile: any; user: any; activeTab: string; onTabChange: (t: string) => void; meta: any }>(() => import("@/components/HRDepartmentDashboard"), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading HR Dashboard...</span></div> });

// ─── Department metadata ──────────────────────────────────────────────────────
type DeptMeta = { Icon: any; gradient: string; accent: string; lightBg: string; borderColor: string };
const SUB_DEPT_META: Record<string, DeptMeta> = {
  DENTAL:      { Icon: Smile,       gradient: "linear-gradient(135deg,#06b6d4,#0891b2)", accent: "#0891b2", lightBg: "#ecfeff", borderColor: "#a5f3fc" },
  DERMATOLOGY: { Icon: Sparkles,    gradient: "linear-gradient(135deg,#ec4899,#be185d)", accent: "#be185d", lightBg: "#fdf2f8", borderColor: "#fbcfe8" },
  HAIR:        { Icon: Scissors,    gradient: "linear-gradient(135deg,#8b5cf6,#6d28d9)", accent: "#6d28d9", lightBg: "#f5f3ff", borderColor: "#ddd6fe" },
  ONCOLOGY:    { Icon: Activity,    gradient: "linear-gradient(135deg,#f97316,#c2410c)", accent: "#c2410c", lightBg: "#fff7ed", borderColor: "#fed7aa" },
  CARDIOLOGY:  { Icon: Heart,       gradient: "linear-gradient(135deg,#ef4444,#b91c1c)", accent: "#b91c1c", lightBg: "#fff5f5", borderColor: "#fecaca" },
  PATHOLOGY:   { Icon: Microscope,  gradient: "linear-gradient(135deg,#10b981,#047857)", accent: "#047857", lightBg: "#f0fdf4", borderColor: "#a7f3d0" },
  PHARMACY:    { Icon: Pill,        gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#07595D", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  BILLING:     { Icon: Receipt,     gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0E898F", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  RADIOLOGY:   { Icon: Scan,        gradient: "linear-gradient(135deg,#6366f1,#4338ca)", accent: "#4338ca", lightBg: "#eef2ff", borderColor: "#c7d2fe" },
  LABORATORY:  { Icon: TestTube2,   gradient: "linear-gradient(135deg,#14b8a6,#0f766e)", accent: "#0f766e", lightBg: "#f0fdfa", borderColor: "#99f6e4" },
  PROCEDURE:   { Icon: Stethoscope, gradient: "linear-gradient(135deg,#84cc16,#4d7c0f)", accent: "#4d7c0f", lightBg: "#f7fee7", borderColor: "#d9f99d" },
  RECEPTION:   { Icon: Users,       gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0E898F", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  OPD:              { Icon: Building2,   gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0E898F", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  GENERAL_MEDICINE: { Icon: Stethoscope, gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0E898F", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  NURSING:     { Icon: Heart,       gradient: "linear-gradient(135deg,#ec4899,#be185d)", accent: "#be185d", lightBg: "#fdf2f8", borderColor: "#fbcfe8" },
  HOUSEKEEPING:{ Icon: ClipboardList,gradient: "linear-gradient(135deg,#f97316,#c2410c)", accent: "#c2410c", lightBg: "#fff7ed", borderColor: "#fed7aa" },
  AMBULANCE:   { Icon: Activity,    gradient: "linear-gradient(135deg,#ef4444,#b91c1c)", accent: "#b91c1c", lightBg: "#fff5f5", borderColor: "#fecaca" },
  BIOMEDICAL:  { Icon: FlaskConical,gradient: "linear-gradient(135deg,#6366f1,#4338ca)", accent: "#4338ca", lightBg: "#eef2ff", borderColor: "#c7d2fe" },
  OTHER:       { Icon: Layers,      gradient: "linear-gradient(135deg,#64748b,#334155)", accent: "#334155", lightBg: "#f8fafc", borderColor: "#e2e8f0" },
};

const PROC_TYPE_COLOR: Record<string, string> = {
  DIAGNOSTIC: "#0E898F", TREATMENT: "#10b981", CONSULTATION: "#8b5cf6",
  SURGERY: "#ef4444", THERAPY: "#f97316", MEDICATION: "#06b6d4", OTHER: "#94a3b8",
};

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  SCHEDULED:   { label: "Scheduled",   bg: "#f8fafc", color: "#475569", border: "#e2e8f0" },
  CONFIRMED:   { label: "Confirmed",   bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  IN_PROGRESS: { label: "In Progress", bg: "#E6F4F4", color: "#0A6B70", border: "#B3E0E0" },
  COMPLETED:   { label: "Completed",   bg: "#f0fdf4", color: "#059669", border: "#a7f3d0" },
  CANCELLED:   { label: "Cancelled",   bg: "#fff5f5", color: "#ef4444", border: "#fecaca" },
  NO_SHOW:     { label: "No Show",     bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
};

const initials = (n: string) => (n || "SD").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();
const calcAge  = (dob: string) => dob ? Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000) : null;

const BLANK_PROC = { name:"", description:"", type:"OTHER", fee:"", duration:"", sequence:"0", isActive:true };
const BLANK_REC  = { patientId:"", patientSearch:"", procedureId:"", appointmentId:"", amount:"", notes:"", performedBy:"", status:"COMPLETED" };

const toSlug = (name: string) => (name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "dept";

function SubDeptDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [user,    setUser]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pharmacyReady, setPharmacyReady] = useState(false);
  const [tab, setTab] = useState<"overview"|"queue"|"procedures"|"records"|"billing"|"billing-queue"|"all-bills"|"finance"|"revenue"|"expense"|"doctors"|"patients"|"inventory"|"reports"|"appointments"|"dept"|"account-settings"|"staff"|"counter-sell">("overview");

  // Sync tab from URL on mount
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t) setTab(t as any);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Build the slug-based path
  const slugPath = profile ? `/subdept/${toSlug(profile.name)}/dashboard` : null;

  // Redirect to slug-based URL once profile is loaded
  useEffect(() => {
    if (!profile) return;
    const slug = toSlug(profile.name);
    const expectedPrefix = `/subdept/${slug}/dashboard`;
    if (!pathname.startsWith(expectedPrefix)) {
      const params = new URLSearchParams(searchParams.toString());
      if (tab) params.set("tab", tab);
      router.replace(`${expectedPrefix}?${params.toString()}`, { scroll: false });
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync tab to URL when it changes
  useEffect(() => {
    if (tab) {
      const base = slugPath || pathname;
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`${base}?${params.toString()}`, { scroll: false });
    }
  }, [tab, slugPath, pathname, router, searchParams]);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  // Department Stock (from Central Store transfers)
  const [deptStock, setDeptStock] = useState<any>(null);
  const [deptStockLoading, setDeptStockLoading] = useState(false);

  // Queue
  const [queue, setQueue] = useState<any[]>([]);
  const [queueMeta, setQueueMeta] = useState<any>({});
  const [queueLoading, setQueueLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [queueSearch, setQueueSearch] = useState("");
  const [recordingFor, setRecordingFor] = useState<any>(null);
  const [selectedQueue, setSelectedQueue] = useState<Set<string>>(new Set());
  const [queueExportOpen, setQueueExportOpen] = useState(false);
  const [completedQueue, setCompletedQueue] = useState<any[]>([]);
  const [directQueue, setDirectQueue] = useState<any[]>([]);
  const [directQueueSearch, setDirectQueueSearch] = useState("");
  const [completedQueueSearch, setCompletedQueueSearch] = useState("");
  const [viewCompletedItem, setViewCompletedItem] = useState<any>(null);
  const [editCompletedItem, setEditCompletedItem] = useState<any>(null);
  const [editCompletedForm, setEditCompletedForm] = useState<any>({});
  const [editCompletedSaving, setEditCompletedSaving] = useState(false);
  const [deleteCompletedTarget, setDeleteCompletedTarget] = useState<any>(null);
  const [deletingCompleted, setDeletingCompleted] = useState(false);

  // Overview: Clinical Procedure referral table
  const [overviewRefSearch, setOverviewRefSearch] = useState("");
  const [overviewDetailItem, setOverviewDetailItem] = useState<any>(null);

  // Queue: Problem / No-show modal
  const [queueProblemTarget, setQueueProblemTarget] = useState<any>(null);
  const [queueProblemForm, setQueueProblemForm] = useState({ status: "NO_SHOW", remarks: "", rescheduleDate: "", rescheduleTime: "" });
  const [queueProblemSaving, setQueueProblemSaving] = useState(false);

  // Queue: Consent form upload modal
  const [consentUploadTarget, setConsentUploadTarget] = useState<any>(null);
  const [consentFile, setConsentFile] = useState<File | null>(null);
  const [consentUrl, setConsentUrl] = useState<string>("");
  const [consentUploading, setConsentUploading] = useState(false);
  const [consentUploadMsg, setConsentUploadMsg] = useState("");

  // Procedures CRUD
  const [procs, setProcs]             = useState<any[]>([]);
  const [procsLoading, setProcsLoading] = useState(false);
  const [showProcForm, setShowProcForm] = useState(false);
  const [editingProc, setEditingProc]   = useState<any>(null);
  const [procForm, setProcForm]         = useState<any>(BLANK_PROC);
  const [procSaving, setProcSaving]     = useState(false);
  const [procMsg, setProcMsg]           = useState("");
  const [selectedProcs, setSelectedProcs] = useState<Set<string>>(new Set());
  const [procExportOpen, setProcExportOpen] = useState(false);
  const [deleteProcTarget, setDeleteProcTarget] = useState<any>(null);
  const [deletingProc, setDeletingProc] = useState(false);
  const [showBulkDeleteProcConfirm, setShowBulkDeleteProcConfirm] = useState(false);
  const [bulkDeletingProcs, setBulkDeletingProcs] = useState(false);
  const [procSearch, setProcSearch] = useState("");

  // AI Auto-Add state
  const [aiAdding, setAiAdding] = useState(false);
  const [aiMsg, setAiMsg] = useState<{ type: "success" | "info" | "error"; text: string } | null>(null);
  const aiMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear AI message timer on unmount
  useEffect(() => {
    return () => {
      if (aiMsgTimerRef.current) clearTimeout(aiMsgTimerRef.current);
    };
  }, []);

  // Upcoming Sessions
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading]   = useState(false);

  // Records
  const [records, setRecords]           = useState<any[]>([]);
  const [recordsMeta, setRecordsMeta]   = useState<any>({});
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsSearch, setRecordsSearch]   = useState("");
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [recordForm, setRecordForm]         = useState<any>(BLANK_REC);
  const [recordSaving, setRecordSaving]     = useState(false);
  const [recordMsg, setRecordMsg]           = useState("");
  const [recordSuccessData, setRecordSuccessData] = useState<any>(null);
  const [recordSuccessBill, setRecordSuccessBill] = useState<any>(null);
  const [autoCollectBillId, setAutoCollectBillId] = useState<string | undefined>(undefined);
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [viewingRecord, setViewingRecord]   = useState<any>(null);
  const [editingRecord, setEditingRecord]   = useState<any>(null);
  const [transferTarget, setTransferTarget] = useState<any>(null);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>("performedAt");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [exportDropdown, setExportDropdown] = useState<"all"|"selected"|null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleteRunning, setBulkDeleteRunning] = useState(false);
  const [deleteRecordTarget, setDeleteRecordTarget] = useState<any>(null);
  const [deletingRecord, setDeletingRecord] = useState(false);
  const [viewPrescription, setViewPrescription] = useState<any>(null);
  const [subDepts, setSubDepts]             = useState<any[]>([]);
  const [transferForm, setTransferForm]     = useState({ subDeptId: "", notes: "" });
  const [transferring, setTransferring]     = useState(false);

  // Reports
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [billingReportData, setBillingReportData] = useState<any>(null);
  const [billingReportLoading, setBillingReportLoading] = useState(false);
  const [recentSearch, setRecentSearch] = useState("");
  const [recentSortField, setRecentSortField] = useState("performedAt");
  const [recentSortDir, setRecentSortDir] = useState<"asc"|"desc">("desc");

  // Revenue / Expense tab
  const [revExpData, setRevExpData] = useState<any>(null);
  const [revExpLoading, setRevExpLoading] = useState(false);
  const [revExpPeriod, setRevExpPeriod] = useState<"today"|"week"|"month"|"all">("month");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ title:"", amount:"", category:"OTHER", date: new Date().toISOString().split("T")[0], description:"" });
  const [expenseSaving, setExpenseSaving] = useState(false);

  // Reception-specific: Doctors
  const [docList, setDocList] = useState<any[]>([]);
  const [docLoading, setDocLoading] = useState(false);
  const [docSearch, setDocSearch] = useState("");

  // Reception: Recent Appointments
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [recentAppointmentsLoading, setRecentAppointmentsLoading] = useState(false);
  const [billingQueue, setBillingQueue] = useState<any[]>([]);
  const [billingQueueLoading, setBillingQueueLoading] = useState(false);

  // ── Reception: Load Recent Appointments ──
  const loadRecentAppointments = useCallback(async () => {
    setRecentAppointmentsLoading(true);
    const res = await fetch("/api/appointments?limit=5", { credentials: "include" }).then(r => r.json());
    if (res.success) setRecentAppointments(res.data?.appointments || res.data?.data || []);
    setRecentAppointmentsLoading(false);
  }, []);

  // ── Reception: Load Billing Queue ──
  const loadBillingQueue = useCallback(async () => {
    setBillingQueueLoading(true);
    const res = await fetch("/api/billing/queue", { credentials: "include" }).then(r => r.json());
    if (res.success) setBillingQueue(res.data || []);
    setBillingQueueLoading(false);
  }, []);

  // ── Revenue / Expense ──
  const loadRevExp = useCallback(async (period = "month") => {
    setRevExpLoading(true);
    const res = await fetch(`/api/pharmacy/revenue-expense?period=${period}`, { credentials: "include" }).then(r => r.json());
    if (res.success) setRevExpData(res.data);
    setRevExpLoading(false);
  }, []);

  useEffect(() => { if (tab === "revenue") loadRevExp(revExpPeriod); }, [tab, revExpPeriod]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load upcoming sessions ──
  const loadSessions = useCallback(async (subDeptId: string) => {
    setSessionsLoading(true);
    const res = await fetch(`/api/treatment-plans?subDepartmentId=${subDeptId}&status=ACTIVE&limit=10`, { credentials: "include" }).then(r => r.json());
    if (res.success) setUpcomingSessions(res.data?.plans || []);
    setSessionsLoading(false);
  }, []);

  // ── Load profile ──
  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { credentials: "include" }).then(r => r.json());
        if (!me.success || me.data?.role !== "SUB_DEPT_HEAD") { router.push("/login"); return; }
        setUser(me.data);
        const prof = await fetch("/api/subdept/me", { credentials: "include" }).then(r => r.json());
        if (prof.success) { 
          setProfile(prof.data); 
          if (prof.data?.id && prof.data?.type !== "RECEPTION") loadSessions(prof.data.id); 
        }
      } catch { router.push("/login"); }
      setLoading(false);
    })();
  }, [router, loadSessions]);

  // ── Stock Received Notifications ──
  const [stockNotifs, setStockNotifs] = useState<any[]>([]);
  const [stockNotifDismissed, setStockNotifDismissed] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    const STORAGE_KEY = `stock_notif_seen_${profile.id}`;

    const poll = async () => {
      try {
        const lastSeen = localStorage.getItem(STORAGE_KEY) || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const res = await fetch(`/api/inventory/stock-notifications?since=${encodeURIComponent(lastSeen)}`, { credentials: "include" }).then(r => r.json());
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setStockNotifs(res.data);
          setStockNotifDismissed(false);
        }
      } catch {}
    };

    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [profile?.id]);

  const dismissStockNotif = () => {
    if (profile?.id) {
      localStorage.setItem(`stock_notif_seen_${profile.id}`, new Date().toISOString());
    }
    setStockNotifs([]);
    setStockNotifDismissed(true);
  };

  // ── Listen for profile updates from AccountSettingsPanel ──
  useEffect(() => {
    const handleProfileUpdate = async () => {
      try {
        const me = await fetch("/api/auth/me", { credentials: "include", cache: "no-store", headers: { "Cache-Control": "no-cache" } }).then(r => r.json());
        if (me.success) setUser(me.data);
      } catch {}
    };
    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, []);

  // ── Load queue ──
  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    const res = await fetch("/api/subdept/queue", { credentials: "include" }).then(r => r.json());
    if (res.success) { setQueue(res.data.queue || []); setCompletedQueue(res.data.completedList || []); setDirectQueue(res.data.directQueue || []); setQueueMeta(res.data); }
    setQueueLoading(false);
  }, []);

  useEffect(() => { if (tab === "queue") loadQueue(); }, [tab, loadQueue]);

  // ── Queue selection & export helpers ──
  const toggleSelectQueue = (id: string) => {
    setSelectedQueue(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const toggleSelectAllQueue = () => {
    if (selectedQueue.size === filteredQueue.length) setSelectedQueue(new Set());
    else setSelectedQueue(new Set(filteredQueue.map((q: any) => q.id)));
  };
  const getQueueExportData = () => {
    const src = selectedQueue.size > 0 ? filteredQueue.filter((q: any) => selectedQueue.has(q.id)) : filteredQueue;
    const headers = ["Token", "Patient", "Patient ID", "Referred On", "Time Slot", "Referred By", "Specialization", "Referral Note", "Type", "Fee (₹)"];
    const rows = src.map((q: any) => [
      q.tokenNumber || "—", q.patient?.name || "—", q.patient?.patientId || "—",
      q.appointmentDate ? new Date(q.appointmentDate).toLocaleDateString("en-IN") : "—",
      q.timeSlot || "—", q.doctor?.name || "—", q.doctor?.specialization || q.doctor?.department || "—",
      q.subDeptNote || q.doctorNotes || "—", q.type || "—", q.consultationFee || "—",
    ]);
    return { headers, rows, count: src.length };
  };
  const exportQueuePDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const { headers, rows, count } = getQueueExportData();
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16); doc.text(`${deptName} — Doctor Referrals Queue`, 14, 18);
    doc.setFontSize(10); doc.setTextColor(100); doc.text(`Exported: ${new Date().toLocaleString("en-IN")}  |  ${count} referral(s)`, 14, 26);
    autoTable(doc, { head: [headers], body: rows, startY: 32, styles: { fontSize:9, cellPadding: 3 }, headStyles: { fillColor: [14, 137, 143], textColor: 255, fontStyle: "bold" }, alternateRowStyles: { fillColor: [248, 250, 252] } });
    doc.save(`referrals-queue-${new Date().toISOString().slice(0, 10)}.pdf`);
    setQueueExportOpen(false);
  };
  const exportQueueExcel = async () => {
    const XLSX = (await import("xlsx")).default || await import("xlsx");
    const { headers, rows } = getQueueExportData();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Referrals");
    XLSX.writeFile(wb, `referrals-queue-${new Date().toISOString().slice(0, 10)}.xlsx`);
    setQueueExportOpen(false);
  };
  const exportQueueWord = async () => {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun, AlignmentType, BorderStyle } = await import("docx");
    const { saveAs } = await import("file-saver");
    const { headers, rows, count } = getQueueExportData();
    const thinBorder = { top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" } };
    const headerRow = new TableRow({ children: headers.map(h => new TableCell({ borders: thinBorder, shading: { fill: "0E898F" }, children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 16, font: "Calibri" })], alignment: AlignmentType.CENTER })], width: { size: 100 / headers.length, type: WidthType.PERCENTAGE } })) });
    const dataRows = rows.map((row: any[]) => new TableRow({ children: row.map((cell: any) => new TableCell({ borders: thinBorder, children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 16, font: "Calibri" })], alignment: AlignmentType.LEFT })] })) }));
    const doc = new Document({ sections: [{ children: [
      new Paragraph({ children: [new TextRun({ text: `${deptName} — Doctor Referrals Queue`, bold: true, size: 32, font: "Calibri" })], spacing: { after: 100 } }),
      new Paragraph({ children: [new TextRun({ text: `Exported: ${new Date().toLocaleString("en-IN")}  |  ${count} referral(s)`, size: 20, color: "64748B", font: "Calibri" })], spacing: { after: 300 } }),
      new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }),
    ] }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `referrals-queue-${new Date().toISOString().slice(0, 10)}.docx`);
    setQueueExportOpen(false);
  };

  // ── Queue: Problem / No-show handler ──
  const handleQueueProblem = async () => {
    if (!queueProblemTarget) return;
    if (queueProblemForm.status === "RESCHEDULED" && (!queueProblemForm.rescheduleDate || !queueProblemForm.rescheduleTime)) {
      alert("Please select a new date and time for the reschedule.");
      return;
    }
    setQueueProblemSaving(true);
    try {
      const res = await fetch("/api/subdept/queue", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: queueProblemTarget.id,
          status: queueProblemForm.status,
          remarks: queueProblemForm.remarks,
          newDate: queueProblemForm.rescheduleDate || undefined,
          newTimeSlot: queueProblemForm.rescheduleTime || undefined,
          patientName: queueProblemTarget.patient?.name,
          patientPhone: queueProblemTarget.patient?.phone,
        }),
      }).then(r => r.json());
      if (res.success) {
        setQueueProblemTarget(null);
        setQueueProblemForm({ status: "NO_SHOW", remarks: "", rescheduleDate: "", rescheduleTime: "" });
        loadQueue();
      } else {
        alert(res.message || "Failed to update status");
      }
    } catch { alert("Network error"); }
    finally { setQueueProblemSaving(false); }
  };

  // ── Queue: Consent form upload ──
  const handleConsentUpload = async (file: File) => {
    setConsentUploading(true);
    setConsentUploadMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "document");
      const res = await fetch("/api/upload", { method: "POST", credentials: "include", body: fd }).then(r => r.json());
      if (res.success) {
        setConsentUrl(res.data.url);
        setConsentUploadMsg("✓ Consent form uploaded successfully");
      } else {
        setConsentUploadMsg(res.message || "Upload failed");
      }
    } catch { setConsentUploadMsg("Network error during upload"); }
    finally { setConsentUploading(false); }
  };

  const proceedAfterConsent = () => {
    if (!consentUploadTarget || consentUploading) return;
    const q = consentUploadTarget;
    setConsentUploadTarget(null);
    setConsentFile(null);
    setConsentUrl("");
    setConsentUploadMsg("");
    setRecordForm({ ...BLANK_REC, patientId: q.patient?.id || "", patientSearch: q.patient?.name || "", appointmentId: q.id, amount: q.suggestedProcedures?.[0]?.fee || "", procedureId: q.suggestedProcedures?.[0]?.id || "" });
    setShowRecordForm(true);
    setTab("records");
  };

  // ── Completed record CRUD helpers ──
  const openEditCompleted = (c: any) => {
    const pr = c.procedureRecords?.[0];
    if (!pr) return;
    setEditCompletedItem(c);
    setEditCompletedForm({ amount: pr.amount || "", notes: pr.notes || "", performedBy: pr.performedBy || "", status: pr.status || "COMPLETED" });
  };
  const saveEditCompleted = async () => {
    const pr = editCompletedItem?.procedureRecords?.[0];
    if (!pr) return;
    setEditCompletedSaving(true);
    await fetch(`/api/subdept/records/${pr.id}`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(editCompletedForm.amount) || 0, notes: editCompletedForm.notes, performedBy: editCompletedForm.performedBy, status: editCompletedForm.status }),
    });
    setEditCompletedSaving(false);
    setEditCompletedItem(null);
    await loadQueue();
  };
  const handleDeleteCompleted = async () => {
    const pr = deleteCompletedTarget?.procedureRecords?.[0];
    if (!pr) return;
    setDeletingCompleted(true);
    await fetch(`/api/subdept/records/${pr.id}`, { method: "DELETE", credentials: "include" });
    setDeletingCompleted(false);
    setDeleteCompletedTarget(null);
    await loadQueue();
  };

  // ── Load procedures (HOD's own) ──
  const loadProcs = useCallback(async () => {
    setProcsLoading(true);
    const res = await fetch("/api/subdept/procedures", { credentials: "include" }).then(r => r.json());
    if (res.success) setProcs(res.data || []);
    setProcsLoading(false);
  }, []);

  useEffect(() => { if (tab === "procedures") loadProcs(); }, [tab, loadProcs]);

  // ── Load Department Stock (from Central Store transfers) ──
  const loadDeptStock = useCallback(async () => {
    setDeptStockLoading(true);
    const res = await fetch("/api/dept-inventory", { credentials: "include" }).then(r => r.json());
    if (res.success) setDeptStock(res.data);
    setDeptStockLoading(false);
  }, []);
  useEffect(() => { if (tab === "inventory") loadDeptStock(); }, [tab, loadDeptStock]);

  // ── Load reports ──
  const loadReports = useCallback(async () => {
    setReportLoading(true);
    const res = await fetch("/api/subdept/reports", { credentials: "include" }).then(r => r.json());
    if (res.success) setReportData(res.data);
    setReportLoading(false);
  }, []);

  useEffect(() => { if (tab === "reports" && profile?.type !== "BILLING") loadReports(); }, [tab, profile?.type, loadReports]);

  const loadBillingReports = useCallback(async () => {
    setBillingReportLoading(true);
    try {
      const [billRes] = await Promise.all([
        fetch("/api/billing?page=1&limit=200", { credentials: "include" }).then(r => r.json()),
      ]);
      const bills: any[] = billRes.data?.bills || [];
      const stats = billRes.data?.stats || {};
      const pagination = billRes.data?.pagination || {};
      const today = new Date();
      const dailyTrend = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split("T")[0];
        const dayBills = bills.filter((b: any) => (b.createdAt || "").startsWith(dateStr));
        const paidBills = dayBills.filter((b: any) => b.status === "PAID");
        return {
          label: d.toLocaleDateString("en-IN", { weekday: "short" }),
          revenue: paidBills.reduce((s: number, b: any) => s + (b.paidAmount || b.total || 0), 0),
          count: dayBills.length,
        };
      });
      const statusMap: Record<string, number> = {};
      bills.forEach((b: any) => { const s = b.status || "UNKNOWN"; statusMap[s] = (statusMap[s] || 0) + 1; });
      const STATUS_COLORS: Record<string, string> = { PAID: "#10b981", PENDING: "#f59e0b", CANCELLED: "#ef4444", DRAFT: "#94a3b8", PARTIAL: "#6366f1" };
      const byStatus = Object.entries(statusMap).map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] || "#94a3b8" }));
      const totalBills = pagination.total || bills.length;
      const paidCount = bills.filter((b: any) => b.status === "PAID").length;
      const pendingCount = stats.pendingCount || (statusMap["PENDING"] || 0);
      const pendingAmount = bills.filter((b: any) => b.status !== "PAID").reduce((s: number, b: any) => s + Math.max(0, (b.total || 0) - (b.paidAmount || 0)), 0);
      setBillingReportData({
        stats: {
          todayRevenue: stats.todayRevenue || 0,
          monthRevenue: stats.monthRevenue || 0,
          pendingCount,
          totalBills,
          paidCount,
          pendingAmount,
          collectionRate: totalBills > 0 ? Math.round((paidCount / totalBills) * 100) : 0,
        },
        dailyTrend,
        byStatus,
      });
    } catch {}
    setBillingReportLoading(false);
  }, []);

  useEffect(() => { if (tab === "reports" && profile?.type === "BILLING") loadBillingReports(); }, [tab, profile?.type, loadBillingReports]);

  const [showQuickBook, setShowQuickBook] = useState(false);

  // ── Load records ──
  const loadRecords = useCallback(async (search = "") => {
    setRecordsLoading(true);
    const url = `/api/subdept/records?limit=30${search ? `&search=${encodeURIComponent(search)}` : ""}`;
    const res = await fetch(url, { credentials: "include" }).then(r => r.json());
    if (res.success) { setRecords(res.data?.data || []); setRecordsMeta(res.data?.stats || {}); }
    setRecordsLoading(false);
  }, []);

  useEffect(() => { if (tab === "records") loadRecords(); }, [tab, loadRecords]);

  // Load subdepartments for transfer
  useEffect(() => {
    fetch("/api/config/subdepartments?limit=50", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success) setSubDepts(d.data?.data || d.data || []); })
      .catch(() => {});
  }, []);

  // ── Reception: Load Doctors ──
  const loadDoctors = useCallback(async (search = "") => {
    setDocLoading(true);
    let url = `/api/config/doctors?limit=50`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await fetch(url, { credentials: "include" }).then(r => r.json());
    if (res.success) setDocList(res.data?.doctors || res.data?.data || res.data || []);
    setDocLoading(false);
  }, []);

  useEffect(() => { if (tab === "doctors") loadDoctors(docSearch); }, [tab, loadDoctors]);

  useEffect(() => {
    if (tab === "overview" && profile?.type === "RECEPTION") {
      loadRecentAppointments();
      loadBillingQueue();
      loadReports();
      loadRecords();
    }
    if (tab === "overview" && profile?.type === "CLINICAL_PROCEDURE") {
      loadQueue();
      loadProcs();
      loadRecords();
    }
  }, [tab, profile, loadRecentAppointments, loadBillingQueue, loadReports, loadRecords, loadQueue, loadProcs]);

  // ── Procedure CRUD ──
  const openAddProc  = () => { setEditingProc(null); setProcForm(BLANK_PROC); setProcMsg(""); setShowProcForm(true); };
  const openEditProc = (p: any) => { setEditingProc(p); setProcForm({ name:p.name, description:p.description||"" , type:p.type, fee:p.fee??"" , duration:p.duration??"" , sequence:p.sequence??0, isActive:p.isActive }); setProcMsg(""); setShowProcForm(true); };

  const saveProc = async () => {
    if (!procForm.name.trim()) { setProcMsg("Name is required"); return; }
    setProcSaving(true); setProcMsg("");
    const url = editingProc ? `/api/subdept/procedures/${editingProc.id}` : "/api/subdept/procedures";
    const method = editingProc ? "PUT" : "POST";
    const res = await fetch(url, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(procForm) }).then(r => r.json());
    if (res.success) { setShowProcForm(false); await loadProcs(); }
    else setProcMsg(res.message || "Failed to save");
    setProcSaving(false);
  };

  const deleteProc = async (id: string) => {
    if (!confirm("Delete this procedure?")) return;
    await fetch(`/api/subdept/procedures/${id}`, { method: "DELETE", credentials: "include" });
    await loadProcs();
  };

  const toggleProcActive = async (p: any) => {
    await fetch(`/api/subdept/procedures/${p.id}`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !p.isActive }) });
    await loadProcs();
  };

  // ── Procedure selection & export helpers ──
  const toggleSelectProc = (id: string) => {
    setSelectedProcs(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const toggleSelectAllProcs = () => {
    if (selectedProcs.size === filteredProcs.length) setSelectedProcs(new Set());
    else setSelectedProcs(new Set(filteredProcs.map((p: any) => p.id)));
  };
  const handleDeleteSingleProc = async () => {
    if (!deleteProcTarget) return;
    setDeletingProc(true);
    await fetch(`/api/subdept/procedures/${deleteProcTarget.id}`, { method: "DELETE", credentials: "include" });
    selectedProcs.delete(deleteProcTarget.id);
    setSelectedProcs(new Set(selectedProcs));
    setDeleteProcTarget(null);
    setDeletingProc(false);
    await loadProcs();
  };
  const bulkDeleteProcs = async () => {
    setBulkDeletingProcs(true);
    for (const id of selectedProcs) {
      await fetch(`/api/subdept/procedures/${id}`, { method: "DELETE", credentials: "include" });
    }
    setSelectedProcs(new Set());
    setShowBulkDeleteProcConfirm(false);
    setBulkDeletingProcs(false);
    await loadProcs();
  };

  // ── AI Auto-Add handler ──
  const handleAiAutoAdd = async () => {
    setAiAdding(true);
    if (aiMsgTimerRef.current) clearTimeout(aiMsgTimerRef.current);
    setAiMsg(null);
    try {
      const res = await fetch("/api/subdept/procedures/ai-suggest", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setAiMsg({ type: "error", text: data?.message || "AI Auto-Add failed. Please try again." });
      } else if (data?.data?.added > 0) {
        await loadProcs();
        setAiMsg({ type: "success", text: `${data.data.added} procedure${data.data.added === 1 ? "" : "s"} added by AI` });
      } else {
        setAiMsg({ type: "info", text: "All suggested procedures already exist" });
      }
    } catch {
      setAiMsg({ type: "error", text: "Network error. Please check your connection and try again." });
    } finally {
      setAiAdding(false);
      aiMsgTimerRef.current = setTimeout(() => setAiMsg(null), 5000);
    }
  };

  const getProcExportData = () => {
    const src = selectedProcs.size > 0 ? displayProcs.filter((p: any) => selectedProcs.has(p.id)) : filteredProcs;
    const headers = ["#", "Name", "Description", "Type", "Fee (₹)", "Duration (min)", "Status"];
    const rows = src.map((p: any, i: number) => [
      i + 1, p.name || "", p.description || "", p.type || "",
      p.fee != null ? p.fee : "—", p.duration || "—", p.isActive ? "Active" : "Inactive",
    ]);
    return { headers, rows, count: src.length };
  };
  const exportProcPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const { headers, rows, count } = getProcExportData();
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text(`${deptName} — Procedure Catalog`, 14, 18);
    doc.setFontSize(10); doc.setTextColor(100); doc.text(`Exported: ${new Date().toLocaleString("en-IN")}  |  ${count} procedure(s)`, 14, 26);
    autoTable(doc, { head: [headers], body: rows, startY: 32, styles: { fontSize:9, cellPadding: 3 }, headStyles: { fillColor: [14, 137, 143], textColor: 255, fontStyle: "bold" }, alternateRowStyles: { fillColor: [248, 250, 252] } });
    doc.save(`procedures-${new Date().toISOString().slice(0, 10)}.pdf`);
    setProcExportOpen(false);
  };
  const exportProcExcel = async () => {
    const XLSX = (await import("xlsx")).default || await import("xlsx");
    const { headers, rows } = getProcExportData();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Procedures");
    XLSX.writeFile(wb, `procedures-${new Date().toISOString().slice(0, 10)}.xlsx`);
    setProcExportOpen(false);
  };
  const exportProcWord = async () => {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun, AlignmentType, BorderStyle } = await import("docx");
    const { saveAs } = await import("file-saver");
    const { headers, rows, count } = getProcExportData();
    const thinBorder = { top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" } };
    const headerRow = new TableRow({ children: headers.map(h => new TableCell({ borders: thinBorder, shading: { fill: "0E898F" }, children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER })], width: { size: 100 / headers.length, type: WidthType.PERCENTAGE } })) });
    const dataRows = rows.map((row: any[]) => new TableRow({ children: row.map((cell: any) => new TableCell({ borders: thinBorder, children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 18, font: "Calibri" })], alignment: AlignmentType.LEFT })] })) }));
    const doc = new Document({ sections: [{ children: [
      new Paragraph({ children: [new TextRun({ text: `${deptName} — Procedure Catalog`, bold: true, size: 32, font: "Calibri" })], spacing: { after: 100 } }),
      new Paragraph({ children: [new TextRun({ text: `Exported: ${new Date().toLocaleString("en-IN")}  |  ${count} procedure(s)`, size: 20, color: "64748B", font: "Calibri" })], spacing: { after: 300 } }),
      new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }),
    ] }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `procedures-${new Date().toISOString().slice(0, 10)}.docx`);
    setProcExportOpen(false);
  };

  // ── Patient search for record form ──
  const searchPatients = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setPatientResults([]); return; }
    const res = await fetch(`/api/patients?search=${encodeURIComponent(q)}&limit=8`, { credentials: "include" }).then(r => r.json());
    if (res.success) setPatientResults(res.data?.patients || res.data || []);
  }, []);

  // ── Save record ──
  const saveRecord = async () => {
    if (!recordForm.patientId || !recordForm.procedureId || !recordForm.amount) { setRecordMsg("Patient, procedure and amount are required"); return; }
    setRecordSaving(true); setRecordMsg("");
    const res = await fetch("/api/subdept/records", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(recordForm) }).then(r => r.json());
    if (res.success) {
      setRecordSuccessData(res.data);
      setRecordSuccessBill(res.data?.bill || null);
      setRecordingFor(null);
      await loadRecords();
    } else {
      setRecordMsg(res.message || "Failed to save");
    }
    setRecordSaving(false);
  };

  // ── Close record modal (clear all state) ──
  const closeRecordModal = () => {
    setShowRecordForm(false);
    setRecordForm(BLANK_REC);
    setRecordMsg("");
    setRecordSuccessData(null);
    setRecordSuccessBill(null);
  };

  // ── Download bill receipt PDF after record save ──
  const downloadBillReceiptPDF = async () => {
    if (!recordSuccessBill) return;
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    const bill = recordSuccessBill;
    const patient = recordSuccessData?.patient;
    const mx = 14; const pw = doc.internal.pageSize.getWidth();
    let y = 18;
    // Header
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(14, 137, 143);
    doc.text(profile?.name || deptName || "Procedure Dept", mx, y); y += 7;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100, 116, 139);
    doc.text("Procedure Bill Receipt", mx, y); y += 10;
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.4); doc.line(mx, y, pw - mx, y); y += 8;
    // Bill meta
    doc.setFontSize(9); doc.setTextColor(71, 85, 105);
    doc.text(`Bill No: ${bill.billNo || "—"}`, mx, y);
    doc.text(`Date: ${new Date(bill.createdAt || Date.now()).toLocaleDateString("en-IN")}`, pw - mx, y, { align: "right" });
    y += 6;
    doc.text(`Status: ${bill.status || "PENDING"}`, mx, y); y += 10;
    // Patient
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(30, 41, 59);
    doc.text("Patient Details", mx, y); y += 6;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(71, 85, 105);
    doc.text(`Name: ${patient?.name || "—"}`, mx, y); y += 5;
    doc.text(`Patient ID: ${patient?.patientId || "—"}`, mx, y); y += 5;
    if (patient?.phone) { doc.text(`Phone: ${patient.phone}`, mx, y); y += 5; }
    y += 6;
    // Procedure items table
    const procItems = (bill.billItems || []).filter((bi: any) => bi.type === "PROCEDURE");
    const rows = procItems.map((bi: any, i: number) => [String(i + 1), bi.name, "1", `Rs. ${Number(bi.unitPrice || 0).toFixed(2)}`, `Rs. ${Number(bi.amount || 0).toFixed(2)}`]);
    if (rows.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["#", "Procedure", "Qty", "Rate", "Amount"]],
        body: rows,
        theme: "striped",
        headStyles: { fillColor: [14, 137, 143], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
        bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: mx, right: mx },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }
    // Total box
    const procTotal = procItems.reduce((s: number, bi: any) => s + Number(bi.amount || 0), 0);
    const sW = 70; const sX = pw - mx - sW;
    doc.setFillColor(240, 253, 244); doc.roundedRect(sX, y, sW, 13, 2, 2, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(5, 150, 105);
    doc.text("Total Amount", sX + 4, y + 8.5);
    doc.text(`Rs. ${procTotal.toFixed(2)}`, sX + sW - 4, y + 8.5, { align: "right" });
    y += 22;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(148, 163, 184);
    doc.text("This is a computer-generated bill receipt.", pw / 2, y, { align: "center" });
    doc.save(`Bill-${bill.billNo || "receipt"}-${(patient?.name || "patient").replace(/\s+/g, "_")}.pdf`);
  };

  // ── Edit record ──
  const handleEditRecord = async (recordId: string, updates: any) => {
    const res = await fetch(`/api/subdept/records/${recordId}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    }).then(r => r.json());
    
    if (res.success) {
      setEditingRecord(null);
      await loadRecords();
    } else {
      alert(res.message || "Failed to update record");
    }
  };

  // ── Transfer patient ──
  const handleTransferPatient = async (record: any, transferData: any) => {
    if (!record.appointment?.id) {
      alert("Cannot transfer: No appointment linked to this record");
      return;
    }

    const res = await fetch(`/api/appointments/${record.appointment.id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subDepartmentId: transferData.subDeptId,
        subDeptNote: transferData.notes || `Transferred from ${profile?.name || "previous department"}`
      })
    }).then(r => r.json());

    if (res.success) {
      setTransferTarget(null);
      setTransferForm({ subDeptId: "", notes: "" });
      alert(`Patient ${record.patient?.name} transferred successfully!`);
    } else {
      alert(res.message || "Failed to transfer patient");
    }
  };

  // ── Records: selection helpers ──
  const toggleSelectRecord = (id: string) => {
    setSelectedRecords(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const toggleSelectAll = () => {
    if (selectedRecords.size === sortedRecords.length) setSelectedRecords(new Set());
    else setSelectedRecords(new Set(sortedRecords.map((r: any) => r.id)));
  };
  const bulkDeleteRecords = async () => {
    setBulkDeleteRunning(true);
    for (const id of selectedRecords) {
      await fetch(`/api/subdept/records/${id}`, { method: "DELETE", credentials: "include" });
    }
    setSelectedRecords(new Set());
    setShowBulkDeleteConfirm(false);
    setBulkDeleteRunning(false);
    await loadRecords(recordsSearch);
  };
  const handleDeleteSingleRecord = async () => {
    if (!deleteRecordTarget) return;
    setDeletingRecord(true);
    const res = await fetch(`/api/subdept/records/${deleteRecordTarget.id}`, { method: "DELETE", credentials: "include" }).then(r => r.json());
    if (res.success) {
      selectedRecords.delete(deleteRecordTarget.id);
      setSelectedRecords(new Set(selectedRecords));
      setDeleteRecordTarget(null);
      await loadRecords(recordsSearch);
    } else { alert(res.message || "Failed to delete record"); }
    setDeletingRecord(false);
  };
  const getExportData = (mode: "all" | "selected") => {
    const src = mode === "selected" ? records.filter((r: any) => selectedRecords.has(r.id)) : sortedRecords;
    const headers = ["Date", "Patient", "Patient ID", "Procedure", "Type", "Amount (₹)", "Performed By", "Status", "Notes"];
    const rows = src.map((r: any) => [
      new Date(r.performedAt).toLocaleDateString("en-IN"),
      r.patient?.name || "", r.patient?.patientId || "",
      r.procedure?.name || "", r.procedure?.type || "",
      r.amount || 0, r.performedBy || "", r.status?.replace(/_/g, " ") || "", r.notes || "",
    ]);
    return { headers, rows, count: src.length };
  };

  const exportExcel = async (mode: "all" | "selected") => {
    const XLSX = (await import("xlsx")).default || await import("xlsx");
    const { headers, rows } = getExportData(mode);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Records");
    XLSX.writeFile(wb, `records-${mode}-${new Date().toISOString().slice(0,10)}.xlsx`);
    setExportDropdown(null);
  };

  const exportPDF = async (mode: "all" | "selected") => {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const { headers, rows, count } = getExportData(mode);
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text(`${deptName} — Procedure Records`, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Exported: ${new Date().toLocaleString("en-IN")}  |  ${count} record(s)`, 14, 26);
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 32,
      styles: { fontSize:9, cellPadding: 3 },
      headStyles: { fillColor: [14, 137, 143], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    doc.save(`records-${mode}-${new Date().toISOString().slice(0,10)}.pdf`);
    setExportDropdown(null);
  };

  const exportWord = async (mode: "all" | "selected") => {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun, AlignmentType, BorderStyle } = await import("docx");
    const { saveAs } = await import("file-saver");
    const { headers, rows, count } = getExportData(mode);
    const thinBorder = { top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" } };
    const headerRow = new TableRow({
      children: headers.map(h => new TableCell({
        borders: thinBorder,
        shading: { fill: "0E898F" },
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER })],
        width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
      })),
    });
    const dataRows = rows.map((row: any[]) => new TableRow({
      children: row.map((cell: any) => new TableCell({
        borders: thinBorder,
        children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 18, font: "Calibri" })], alignment: AlignmentType.LEFT })],
      })),
    }));
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: `${deptName} — Procedure Records`, bold: true, size: 32, font: "Calibri" })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: `Exported: ${new Date().toLocaleString("en-IN")}  |  ${count} record(s)`, size: 20, color: "64748B", font: "Calibri" })], spacing: { after: 300 } }),
          new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }),
        ],
      }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `records-${mode}-${new Date().toISOString().slice(0,10)}.docx`);
    setExportDropdown(null);
  };
  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const handleRecentSort = (field: string) => {
    if (recentSortField === field) setRecentSortDir(d => d === "asc" ? "desc" : "asc");
    else { setRecentSortField(field); setRecentSortDir("desc"); }
  };

  const sortIcon = (field: string, active: string, dir: "asc"|"desc") =>
    active === field
      ? (dir === "asc" ? <ChevronUp size={12}/> : <ChevronDown size={12}/>)
      : <ArrowUpDown size={10} style={{opacity:.35}}/>;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const meta       = SUB_DEPT_META[profile?.type || "OTHER"] || SUB_DEPT_META.OTHER;
  const { Icon: DeptIcon } = meta;
  const profileProcs: any[] = profile?.procedures || [];
  const activeProcs   = procs.length > 0 ? procs.filter((p: any) => p.isActive) : profileProcs.filter((p: any) => p.isActive);
  const displayProcs  = procs.length > 0 ? procs : profileProcs;
  const filteredProcs = procSearch
    ? displayProcs.filter((p: any) => p.name?.toLowerCase().includes(procSearch.toLowerCase()) || p.type?.toLowerCase().includes(procSearch.toLowerCase()) || p.description?.toLowerCase().includes(procSearch.toLowerCase()))
    : displayProcs;
  const pendingBillingQueue = billingQueue.filter((item: any) => item.bill?.status !== "PAID");
  const hodName       = profile?.hodName || user?.name || "HOD";
  const deptName      = (profile?.type === "OTHER" && profile?.customName) ? profile.customName : (profile?.name || "Sub-Department");
  const today         = new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

  // Sorted records
  const sortedRecords = [...records].sort((a: any, b: any) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "performedAt") return dir * (new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime());
    if (sortField === "patient") return dir * ((a.patient?.name || "").localeCompare(b.patient?.name || ""));
    if (sortField === "procedure") return dir * ((a.procedure?.name || "").localeCompare(b.procedure?.name || ""));
    if (sortField === "type") return dir * ((a.procedure?.type || "").localeCompare(b.procedure?.type || ""));
    if (sortField === "amount") return dir * ((a.amount || 0) - (b.amount || 0));
    if (sortField === "performedBy") return dir * ((a.performedBy || "").localeCompare(b.performedBy || ""));
    if (sortField === "status") return dir * ((a.status || "").localeCompare(b.status || ""));
    return 0;
  });

  // Type-based predefined tabs
  const deptType = profile?.type || "OTHER";
  const TYPE_TABS: Record<string, string[]> = {
    DENTAL:           ["overview","appointments","queue","patients","records","inventory","reports","account-settings"],
    DERMATOLOGY:      ["overview","appointments","queue","patients","records","inventory","reports","account-settings"],
    HAIR:             ["overview","appointments","queue","patients","records","inventory","reports","account-settings"],
    ONCOLOGY:         ["overview","appointments","queue","patients","records","inventory","reports","account-settings"],
    CARDIOLOGY:       ["overview","appointments","queue","patients","records","inventory","reports","account-settings"],
    COSMETIC:         ["overview","appointments","queue","patients","records","inventory","reports","account-settings"],
    PHYSIOTHERAPY:    ["overview","appointments","queue","patients","records","inventory","reports","account-settings"],
    DIALYSIS:         ["overview","appointments","queue","patients","records","inventory","reports","account-settings"],
    GYNECOLOGY:       ["overview","appointments","queue","patients","records","inventory","reports","account-settings"],
    PEDIATRICS:       ["overview","appointments","queue","patients","records","inventory","reports","account-settings"],
    RECEPTION:        ["overview","appointments","billing","patients","doctors","inventory","reports","account-settings"],
    PHARMACY:         ["overview","queue","counter-sell","inventory","billing","revenue","expense","reports","account-settings"],
    NURSING:          ["overview","inventory","account-settings"],
    HOUSEKEEPING:     ["overview","inventory","account-settings"],
    AMBULANCE:        ["overview","inventory","account-settings"],
    BIOMEDICAL:       ["overview","inventory","account-settings"],
    BILLING:          ["overview","billing-queue","finance","inventory","reports","account-settings"],
    PATHOLOGY:        ["overview","orders","samples","results","reports","revenue","tests","panels","analytics"],
    RADIOLOGY:        ["overview","queue","records","reports","account-settings"],
    LABORATORY:       ["overview","queue","records","reports","account-settings"],
    BLOOD_BANK:       ["overview","queue","records","reports","account-settings"],
    ECG:              ["overview","queue","records","reports","account-settings"],
    ENDOSCOPY:        ["overview","queue","records","reports","account-settings"],
    ICU:              ["overview","queue","records","reports","account-settings"],
    EMERGENCY:        ["overview","queue","records","reports","account-settings"],
    IPD:              ["overview","queue","records","reports","account-settings"],
    OPD:              ["overview","appointments","queue","patients","records","revenue","expenses","reports","account-settings"],
    GENERAL_MEDICINE: ["overview","appointments","queue","patients","records","revenue","expenses","reports","account-settings"],
    OT:               ["overview","queue","procedures","records","billing","reports","account-settings"],
    SURGERY:          ["overview","queue","procedures","records","billing","reports","account-settings"],
    CLINICAL_PROCEDURE:["overview","queue","procedures","records","billing","reports","account-settings"],
    HR:               ["overview","staff","doctors"],
    ACCOUNTS:         ["overview","queue","procedures","records","billing","reports","account-settings"],
    PROCEDURE:        ["overview","queue","procedures","records","billing","inventory","reports","account-settings"],
    OTHER:            ["overview","queue","procedures","records","billing","inventory","reports","account-settings"],
    CUSTOM:           ["overview","queue","procedures","records","billing","inventory","reports","account-settings"],
  };
  const enabledTabs = new Set(TYPE_TABS[deptType] || TYPE_TABS.OTHER);

  const allNavItems: {id:string;label:string;icon:any;badge?:any}[] = [
    { id: "overview",      label: "Overview",           icon: <LayoutDashboard size={16}/> },
    { id: "queue",         label: deptType === "PHARMACY" ? "Rx Queue" : ["OPD","GENERAL_MEDICINE"].includes(deptType) ? "Queue / Tokens" : "Referrals Today", icon: <UserCheck size={16}/> },
    { id: "consultations",  label: "Consultations",       icon: <Stethoscope size={16}/> },
    { id: "procedures",    label: "Procedures",         icon: <ClipboardList size={16}/> },
    { id: "records",       label: "Patient Records",    icon: <IndianRupee size={16}/> },
    { id: "appointments",  label: "Appointments",       icon: <CalendarDays size={16}/> },
    { id: "billing",       label: "Billing",            icon: <Receipt size={16}/> },
    { id: "counter-sell",  label: "Counter Sell",       icon: <ShoppingCart size={16}/> },
    { id: "billing-queue",  label: "Billing Queue",      icon: <CreditCard size={16}/> },
    
    { id: "patients",      label: "Patient Management", icon: <Users size={16}/> },
    { id: "doctors",       label: "Doctors",            icon: <Stethoscope size={16}/> },
    { id: "inventory",     label: "Inventory",          icon: <Package size={16}/> },
        { id: "staff",          label: "Staff Management",   icon: <Users size={16}/> },
    { id: "purchases",    label: "Purchases",          icon: <Package size={16}/> },
    { id: "reports",       label: deptType==="PATHOLOGY" ? "Report & Deliver" : "Reports", icon: <BarChart2 size={16}/> },
    { id: "revenue",       label: "Revenue",            icon: <IndianRupee size={16}/> },
    { id: "expenses",      label: "Expenses",           icon: <TrendingDown size={16}/> },
    { id: "expense",       label: "Expense",            icon: <TrendingDown size={16}/> },
    { id: "finance",       label: "Revenue/Expense",    icon: <TrendingUp size={16}/> },
    // Pathology LIS tabs
    { id: "orders",        label: "Lab Orders",        icon: <ClipboardList size={16}/> },
    { id: "samples",       label: "Sample Collections", icon: <FlaskConical size={16}/> },
    { id: "results",       label: "Result Entry",       icon: <Activity size={16}/> },
    { id: "tests",         label: "Test Master",        icon: <TestTube2 size={16}/> },
    { id: "panels",        label: "Test Panels",        icon: <Layers size={16}/> },
    { id: "analytics",     label: "Analytics",          icon: <TrendingUp size={16}/> },
    { id: "account-settings", label: "Account Settings", icon: <Settings size={16}/> },
  ];
  const navItems = (TYPE_TABS[deptType] || TYPE_TABS.OTHER)
    .map(id => allNavItems.find(n => n.id === id))
    .filter(Boolean) as {id:string;label:string;icon:any;badge?:any}[];

  const filteredQueue = queue.filter(q => {
    return !queueSearch ||
      q.patient?.name?.toLowerCase().includes(queueSearch.toLowerCase()) ||
      q.patient?.patientId?.toLowerCase().includes(queueSearch.toLowerCase()) ||
      String(q.tokenNumber || "").includes(queueSearch);
  });

  const TAB_TITLES: Record<string,string> = {"billing-queue":"Billing Queue","all-bills":"All Bills",overview:"Overview",queue:"Patient Queue",procedures:"Procedures",records:"Patient Records",appointments:"Appointments",billing:"Billing",finance:"Finance",doctors:"Doctors",patients:"Patient Management",inventory:"Inventory",reports:"Reports",revenue:"Revenue",expenses:"Expenses",expense:"Expense",dept:"Department Info",staff:"Staff Management","counter-sell":"Counter Sell","account-settings":"Account Settings"};

  return (
    <>
      <Preloader loading={loading || (deptType === "PHARMACY" && !loading && !pharmacyReady && tab !== "account-settings")} />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
        body{font-family:'Inter',sans-serif}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .sd2{display:flex;height:100vh;overflow:hidden;font-family:'Inter',sans-serif;background:#fff}
        .sd2-overlay{display:none;position:fixed;inset:0;background:rgba(15,23,42,0.45);z-index:45;backdrop-filter:blur(2px)}
        .sd2-overlay.open{display:block}
        .sd2-sb{width:224px;background:#fff;border-right:1px solid var(--bc);display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:50;box-shadow:2px 0 8px rgba(0,0,0,0.04);transition:transform .25s cubic-bezier(.4,0,.2,1)}
        .sd2-burger{display:none;width:36px;height:36px;border-radius:10px;background:var(--lbg);border:1px solid var(--bc);align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
        .sd2-logo{padding:18px 20px 14px;border-bottom:1px solid var(--bc);display:flex;flex-direction:column;align-items:center;gap:8px}
        .sd2-logo-ic{width:52px;height:52px;border-radius:13px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.08);flex-shrink:0;overflow:hidden;background:#fff;border:1px solid #e2e8f0}
        .sd2-logo-ic img{width:100%;height:100%;object-fit:contain}
        .sd2-logo-ic.no-logo{background:var(--grad);border:none;box-shadow:0 4px 12px rgba(0,0,0,.15)}
        .sd2-nav{flex:1;padding:12px;overflow-y:auto}
        .sd2-nav-sec{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding:0 8px;margin:10px 0 5px}
        .sd2-nb{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:10px;border:none;background:none;color:#64748b;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;margin-bottom:2px;text-align:left;position:relative}
        .sd2-nb:hover{background:var(--lbg);color:var(--acc)}
        .sd2-nb.on{background:var(--lbg);color:var(--acc);font-weight:600}
        .sd2-nb-dot{display:none;width:3px;height:20px;background:var(--acc);border-radius:4px;position:absolute;left:0}
        .sd2-nb.on .sd2-nb-dot{display:block}
        .sd2-nb svg{color:#94a3b8;flex-shrink:0;transition:color .15s}
        .sd2-nb.on svg,.sd2-nb:hover svg{color:var(--acc)}
        .sd2-foot{padding:14px 16px 18px;border-top:1px solid var(--bc)}
        .sd2-user{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:var(--lbg);border:1px solid var(--bc);margin-bottom:10px}
        .sd2-av{width:34px;height:34px;border-radius:9px;background:var(--grad);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0}
        .sd2-logout{width:100%;padding:8px;border-radius:9px;background:#fff5f5;border:1px solid #fee2e2;color:#ef4444;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .15s}
        .sd2-logout:hover{background:#fee2e2}
        .sd2-main{margin-left:224px;flex:1;display:flex;flex-direction:column;height:100vh;overflow:hidden}
        .sd2-topbar{height:64px;background:#fff;border-bottom:1px solid var(--bc);display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:relative;z-index:40;flex-shrink:0;box-shadow:0 1px 4px rgba(0,0,0,.04)}
        .sd2-search{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;width:260px}
        .sd2-search input{background:none;border:none;outline:none;font-size:12px;color:#334155;width:100%}
        .sd2-search input::placeholder{color:#94a3b8}
        .sd2-body{padding:24px;overflow-y:auto;flex:1;animation:fadeUp .35s ease}
        .sd2-card{background:#fff;border-radius:14px;border:1px solid var(--bc);box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;margin-bottom:18px}
        .sd2-card-hd{padding:14px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f1f5f9}
        .sd2-card-title{font-size:13px;font-weight:700;color:#1e293b;display:flex;align-items:center;gap:8px}
        .sd2-sc{background:#fff;border-radius:14px;padding:18px;border:1px solid var(--bc);display:flex;align-items:center;gap:14px;box-shadow:0 1px 4px rgba(0,0,0,.04);transition:transform .2s,box-shadow .2s}
        .sd2-sc:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.08)}
        .sd2-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:100px;font-size:10px;font-weight:700}
        .sd2-tbl{width:100%;border-collapse:collapse}
        .sd2-tbl th{text-align:left;font-size:10px;font-weight:600;color:#94a3b8;padding:10px 14px;border-bottom:2px solid #f1f5f9;white-space:nowrap}
        .sd2-tbl td{padding:12px 14px;font-size:12px;color:#475569;border-bottom:1px solid #f8fafc;vertical-align:middle}
        .sd2-tbl tbody tr:hover td{background:#fafbff}
        .sd2-tbl tbody tr:last-child td{border-bottom:none}
        .sd2-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:8px;border:none;font-size:10px;font-weight:600;cursor:pointer;transition:all .15s}
        .sd2-q-row{border-bottom:1px solid #f1f5f9;transition:background .15s}
        .sd2-q-row:hover{background:#fafbff}
        .sd2-q-row:last-child{border-bottom:none}
        .sd2-expand{background:#f8fafc;border-top:1px solid #f1f5f9;padding:14px 18px;animation:fadeUp .2s ease}
        .sd2-flow-step{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:500;color:#475569}
        .sd2-flow-arrow{color:#94a3b8;font-size:10px}
        .sd2-pill{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:100px;font-size:10px;font-weight:700}
        .hd-center{padding:0;overflow:visible}
        .hd-pg-title{font-size:17px;font-weight:800;color:#1e293b;letter-spacing:-.02em;margin-bottom:18px}
        .hd-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
        .hd-stat{background:#fff;border-radius:14px;padding:18px;border:1px solid #e2e8f0;display:flex;align-items:center;gap:14px;box-shadow:0 1px 4px rgba(0,0,0,.04)}
        .hd-stat-ico{width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .hd-stat-num{font-size:20px;font-weight:800;color:#1e293b}
        .hd-stat-lbl{font-size:10px;color:#94a3b8;margin-top:2px}
        .hd-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:18px;box-shadow:0 1px 4px rgba(0,0,0,.04)}
        .hd-card-hd{padding:14px 18px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between}
        .hd-table{width:100%;border-collapse:collapse}
        .hd-table th{text-align:left;font-size:10px;font-weight:600;color:#94a3b8;padding:10px 14px;border-bottom:2px solid #f1f5f9;white-space:nowrap}
        .hd-table td{padding:12px 14px;font-size:12px;color:#475569;border-bottom:1px solid #f8fafc;vertical-align:middle}
        .hd-table tbody tr:hover td{background:#fafbff}
        @media(max-width:900px){
          .sd2-sb{transform:translateX(-100%)}
          .sd2-sb.open{transform:translateX(0)}
          .sd2-main{margin-left:0}
          .sd2-burger{display:flex}
        }
        @media(max-width:600px){
          .sd2-topbar{padding:0 14px;gap:8px}
          .sd2-body{padding:16px 12px}
          .sd2-search{width:160px}
        }
      `}</style>

      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
      <div className="sd2" style={{"--grad":meta.gradient,"--acc":meta.accent,"--lbg":meta.lightBg,"--bc":meta.borderColor} as any}>
        {sidebarOpen && <div className="sd2-overlay open" onClick={() => setSidebarOpen(false)} />}
        {/* ── Sidebar ── */}
        <aside className={`sd2-sb${sidebarOpen ? " open" : ""}`}>
          <div className="sd2-logo">
            {profile?.hospitalSettings?.logo ? (
              <img src={profile.hospitalSettings.logo} alt="Hospital Logo" style={{ width: "100%", maxHeight: 60, objectFit: "contain", display: "block" }} />
            ) : (
              <div className="sd2-logo-ic no-logo">
                <DeptIcon size={22} color="#fff"/>
              </div>
            )}
          </div>

          <nav className="sd2-nav">
            <div className="sd2-nav-sec">Navigation</div>
            {navItems.map(n => (
              <button key={n.id} className={`sd2-nb${tab===n.id?" on":""}`} onClick={()=>{setTab(n.id as any);setSidebarOpen(false);}}>
                <div className="sd2-nb-dot"/>
                <span style={{display:"flex"}}>{n.icon}</span>
                {n.label}
                {n.badge ? <span style={{marginLeft:"auto",minWidth:18,height:18,borderRadius:9,background:meta.accent,color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 5px"}}>{n.badge}</span> : null}
              </button>
            ))}
            <div className="sd2-nav-sec">Help</div>
            <button className="sd2-nb" onClick={() => setSupportOpen(true)}>
              <div className="sd2-nb-dot"/>
              <span style={{display:"flex"}}><HelpCircle size={16}/></span>
              Support
            </button>

          </nav>

          <div className="sd2-foot">
            <div className="sd2-user">
              <div className="sd2-av">{initials(hodName)}</div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:11,fontWeight:600,color:"#1e293b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{hodName}</div>
                <div style={{fontSize:10,fontWeight:500,color:meta.accent}}>Sub-Dept Head</div>
              </div>
            </div>
            <button className="sd2-logout" onClick={logout}><LogOut size={13}/>Log Out</button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="sd2-main">

          {/* Top Bar */}
          <header className="sd2-topbar" style={(tab === "reports" && (deptType === "BILLING" || deptType === "RECEPTION")) ? {display:"none"} : {}}>
            <button className="sd2-burger" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
              {sidebarOpen ? <X size={18} color="var(--acc)" /> : <Menu size={18} color="#64748b" />}
            </button>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:"#1e293b"}}>{TAB_TITLES[tab] || "Overview"}</div>
              <div style={{fontSize:10,color:"#94a3b8",marginTop:1}}>{today}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              
              <NotificationBell 
                accentColor={meta.accent} 
                bgColor={meta.lightBg} 
                borderColor={meta.borderColor} 
                types={profile?.type === "PHARMACY" 
                  ? ["NEW_PRESCRIPTION","PRESCRIPTION_COMPLETED","LOW_STOCK","EXPIRING_MEDICINE","BILLING_TRANSFER"] 
                  : ["PROCEDURE_COMPLETED","APPOINTMENT_UPDATED"]
                } 
              />
              <div 
                style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:10,background:meta.lightBg,border:`1px solid ${meta.borderColor}`,cursor:"pointer",position:"relative"}}
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <div style={{width:28,height:28,borderRadius:8,background:meta.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff"}}>{initials(hodName)}</div>
                <div><div style={{fontSize:11,fontWeight:600,color:"#1e293b"}}>{hodName.split(" ")[0]}</div><div style={{fontSize:10,color:meta.accent}}>HOD</div></div>
                <ChevronDown size={14} color="#64748b" />
                
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
                      border: `1px solid ${meta.borderColor}`,
                      boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                      zIndex: 70,
                      overflow: "hidden",
                    }}>
                      <div style={{ padding: 16, borderBottom: `1px solid ${meta.borderColor}` }}>
                        <div style={{ fontSize:13, fontWeight: 600, color: "#1e293b" }}>{hodName}</div>
                        <div style={{ fontSize:11, color: "#64748b", marginTop: 2 }}>{user?.email}</div>
                      </div>
                      <div style={{ padding: 8 }}>
                        <button 
                          onClick={() => { setProfileDropdownOpen(false); setTab("account-settings" as any); }}
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
                          onMouseEnter={(e) => { e.currentTarget.style.background = meta.lightBg; }}
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

          <div className="sd2-body" style={tab === "inventory" ? { padding: "32px 20px" } : (tab === "billing-queue" || tab === "reports" || tab === "billing" || tab === "revenue") ? { padding: 0 } : {}}>

            {/* ═══════════════════ SUPPORT DEPARTMENT DASHBOARDS ═══════════════════ */}
            {deptType === "PATHOLOGY" && tab !== "account-settings" ? (
              <PathologyDashboardLazy profile={profile} user={user} activeTab={tab} onTabChange={(t: string) => setTab(t as any)} />
            ) : tab === "account-settings" ? (
              <AccountSettingsPanelLazy user={user} />
            ) : deptType === "PHARMACY" ? (
              <PharmacyDashboardLazy profile={profile} user={user} activeTab={tab} onReady={() => setPharmacyReady(true)} />
            ) : deptType === "NURSING" ? (
              <NursingDashboardLazy profile={profile} user={user} />
            ) : deptType === "HOUSEKEEPING" ? (
              <HousekeepingDashboardLazy profile={profile} user={user} />
            ) : deptType === "AMBULANCE" ? (
              <AmbulanceDashboardLazy profile={profile} user={user} />
            ) : deptType === "BIOMEDICAL" ? (
              <BiomedicalDashboardLazy profile={profile} user={user} />
            ) : ["OPD", "GENERAL_MEDICINE", "DENTAL", "DERMATOLOGY", "HAIR", "ONCOLOGY", "CARDIOLOGY", "COSMETIC", "PHYSIOTHERAPY", "DIALYSIS", "GYNECOLOGY", "PEDIATRICS"].includes(deptType) ? (
              // Use DentalOPDDashboard for: Clinical OPD subdepartments OR departments with "dental" in name
              (profile?.department?.type === "CLINICAL" && deptType === "OPD") || 
              (profile?.name?.toLowerCase()?.includes("dental") || profile?.customName?.toLowerCase()?.includes("dental")) ? (
                <DentalOPDDashboardLazy profile={profile} user={user} activeTab={tab} onTabChange={(t: string) => setTab(t as any)} meta={meta} />
              ) : (
                <OPDDashboardLazy profile={profile} user={user} activeTab={tab} onTabChange={(t: string) => setTab(t as any)} meta={meta} />
              )
            ) : deptType === "HR" && ["overview", "staff", "doctors"].includes(tab) ? (
              <HRDepartmentDashboardLazy profile={profile} user={user} activeTab={tab} onTabChange={(t: string) => setTab(t as any)} meta={meta} />
            ) : deptType === "BILLING" && ["overview","billing-queue","finance","inventory"].includes(tab) ? (
              <BillingDepartmentDashboardLazy profile={profile} user={user} activeTab={tab} onTabChange={(t: string) => setTab(t as any)} meta={meta} />
            ) : (<>

            {/* ═══════════════════ OVERVIEW ═══════════════════ */}
            {tab==="overview" && (<>
              {/* Header: title + live indicator + refresh */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em" }}>{deptName} Dashboard</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 0 3px #dcfce7", flexShrink: 0 }} />
                    Live &middot; Updated {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {profile?.type === "RECEPTION" && (
                    <button
                      onClick={() => { setShowQuickBook(true); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 12,
                        border: "none", background: "linear-gradient(135deg, #0E898F, #0A6B70)",
                        color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
                    >
                      <Plus size={16} strokeWidth={3} />
                      New Appointment
                    </button>
                  )}
                  <button
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw size={13} /> Refresh
                  </button>
                </div>
              </div>

              {/* Stats Grid - One horizontal line for Reception */}
              <div style={{
                display:"grid",
                gridTemplateColumns: profile?.type === "RECEPTION" ? "repeat(5, 1fr)" : "repeat(4, 1fr)",
                gap:10,
                marginBottom:20
              }}>
                {(profile?.type === "RECEPTION" ? [
                  { label:"Today's Appts", value:recentAppointments.length, Icon:CalendarDays, color:meta.accent, bg:meta.lightBg,
                    badge: { text: "TODAY", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
                    onClick:()=>setTab("appointments") },
                  { label:"Pending Bills", value:pendingBillingQueue.length, Icon:Clock, color:pendingBillingQueue.length > 0 ? "#ea580c" : meta.accent, bg:pendingBillingQueue.length > 0 ? "#fff7ed" : meta.lightBg,
                    badge: pendingBillingQueue.length > 0 ? { text: "URGENT", bg: "#fff3e6", color: "#ea580c", border: "#fed7aa" } : { text: "CLEAR", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
                    onClick:()=>setTab("billing") },
                  { label:"New Patients Today", value:recordsMeta.todayRecords||0, Icon:UserPlus, color:meta.accent, bg:meta.lightBg,
                    badge: { text: "TODAY", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
                    onClick:()=>setTab("patients") },
                  { label:"Billing Today",     value:`₹${(recordsMeta.todayRevenue||0).toLocaleString("en-IN")}`, Icon:IndianRupee, color:"#16a34a", bg:"#f0fdf4",
                    badge: { text: "TODAY", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
                    onClick:()=>setTab("billing") },
                  { label:"Total Revenue",     value:`₹${(recordsMeta.totalRevenue||0).toLocaleString("en-IN")}`, Icon:IndianRupee, color:"#059669", bg:"#f0fdf4",
                    onClick:()=>setTab("records") },
                ] : [
                  { label:"Active Procedures", value:activeProcs.length, Icon:ClipboardList, color:meta.accent, bg:meta.lightBg },
                  { label:"Referrals Today",   value:queue.length||"—",  Icon:UserCheck,     color:meta.accent, bg:meta.lightBg,
                    badge: { text: "TODAY", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
                    onClick:()=>{setTab("queue");loadQueue();} },
                  { label:"Records Today",     value:recordsMeta.todayRecords||0, Icon:ClipboardList, color:meta.accent, bg:meta.lightBg,
                    badge: { text: "TODAY", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
                    onClick:()=>{setTab("records");loadRecords();} },
                  { label:"Today Revenue",     value:`₹${(recordsMeta.todayRevenue||0).toLocaleString("en-IN")}`, Icon:IndianRupee, color:"#10b981", bg:"#f0fdf4",
                    badge: { text: "TODAY", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
                    onClick:()=>{setTab("records");loadRecords();} },
                ]).map((s,i)=>{
                  const SI = s.Icon;
                  return (
                    <div key={i} className="sd2-sc" onClick={s.onClick} style={{
                      cursor:s.onClick?"pointer":"default", 
                      padding: "10px 12px", 
                      gap: 10,
                      background: "#fff",
                      borderRadius: 12,
                      border: `1px solid ${s.badge?.color === "#ea580c" ? "#fed7aa" : "var(--bc)"}`,
                    }}>
                      <div style={{width:38,height:38,borderRadius:10,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <SI size={18} color={s.color}/>
                      </div>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{display:"flex", alignItems:"center", gap:4, marginBottom:1}}>
                          <div style={{fontSize:16,fontWeight:800,color:"#1e293b", lineHeight: 1.1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{s.value}</div>
                          {s.badge && (
                            <span style={{
                              fontSize: 7, 
                              fontWeight: 700, 
                              color: s.badge.color, 
                              background: s.badge.bg, 
                              padding: "1px 4px", 
                              borderRadius: 8, 
                              border: `1px solid ${s.badge.border}`,
                              flexShrink: 0
                            }}>
                              {s.badge.text}
                            </span>
                          )}
                        </div>
                        <div style={{fontSize:9,color:"#64748b", lineHeight: 1.2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{s.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Row 2: Secondary Chips for Non-Reception */}
              {profile?.type !== "RECEPTION" && (
                <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:12,marginBottom:20}}>
                  {[
                    { label:"Total Procedures",  value:displayProcs.length, Icon:Layers,       color:meta.accent, bg:meta.lightBg },
                    { label:"Total Records",     value:recordsMeta.totalRecords||0, Icon:Layers, color:meta.accent, bg:meta.lightBg,
                      onClick:()=>{setTab("records");loadRecords();} },
                    { label:"Total Revenue",     value:`₹${(recordsMeta.totalRevenue||0).toLocaleString("en-IN")}`, Icon:IndianRupee, color:"#059669", bg:"#f0fdf4",
                      onClick:()=>{setTab("records");loadRecords();} },
                    { label:"Active Staff",      value:profile?.staffCount||"—", Icon:Users, color:"#6366f1", bg:"#eef2ff" },
                  ].map((s,i)=>{
                    const SI = s.Icon;
                    return (
                      <div key={i} className="sd2-sc" onClick={s.onClick} style={{
                        cursor:s.onClick?"pointer":"default", 
                        padding: "12px 16px", 
                        gap: 12,
                        borderRadius: 12,
                        background: s.bg,
                        border: "1px solid var(--bc)"
                      }}>
                        <div style={{width:36,height:36,borderRadius:10,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
                          <SI size={16} color={s.color}/>
                        </div>
                        <div>
                          <div style={{fontSize:18,fontWeight:800,color:"#1e293b", lineHeight: 1.2}}>{s.value}</div>
                          <div style={{fontSize:11,color:"#64748b"}}>{s.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Charts for Reception Overview */}
              {profile?.type === "RECEPTION" && (
                reportLoading || !reportData ? (
                  <div style={{height:280,background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20,color:"#94a3b8",fontSize:12,gap:8}}>
                    <Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading dashboard analytics...
                  </div>
                ) : (
                  <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:18,marginBottom:20}}>
                    {/* Daily Trend Chart */}
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"18px 20px 14px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:"#1e293b"}}>Daily Patient Flow & Revenue</div>
                          <div style={{fontSize:10,color:"#94a3b8"}}>Activity trend for the last 7 days</div>
                        </div>
                        <div style={{display:"flex",gap:10}}>
                          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:9,color:"#64748b"}}>
                            <span style={{width:8,height:8,borderRadius:2,background:meta.accent}}/> Patients
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:9,color:"#64748b"}}>
                            <span style={{width:8,height:8,borderRadius:2,background:"#10b981"}}/> Revenue
                          </div>
                        </div>
                      </div>
                      <div style={{width:"100%",height:220}}>
                        <RechartsResponsiveContainer width="100%" height="100%">
                          <RechartsAreaChart data={reportData?.dailyTrend?.slice(-8)||[]} margin={{top:5,right:10,left:-15,bottom:0}}>
                            <defs>
                              <linearGradient id="gradOverCount" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={meta.accent} stopOpacity={.3}/><stop offset="100%" stopColor={meta.accent} stopOpacity={0}/></linearGradient>
                              <linearGradient id="gradOverRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={.25}/><stop offset="100%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                            </defs>
                            <RechartsXAxis dataKey="label" tick={{fontSize:9,fill:"#94a3b8"}} tickLine={false} axisLine={{stroke:"#f1f5f9"}}/>
                            <RechartsYAxis yAxisId="left" tick={{fontSize:9,fill:"#94a3b8"}} tickLine={false} axisLine={false}/>
                            <RechartsYAxis yAxisId="right" orientation="right" tick={{fontSize:9,fill:"#94a3b8"}} tickLine={false} axisLine={false}/>
                            <RechartsTooltip contentStyle={{borderRadius:10,border:"1px solid #e2e8f0",fontSize:10,boxShadow:"0 4px 12px rgba(0,0,0,.08)"}}/>
                            <RechartsArea yAxisId="left" type="monotone" dataKey="count" stroke={meta.accent} fill="url(#gradOverCount)" strokeWidth={2.5} name="Patients" dot={{r:4,fill:meta.accent,strokeWidth:2,stroke:"#fff"}} activeDot={{r:6}}/>
                            <RechartsArea yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#gradOverRev)" strokeWidth={2.5} name="Revenue" dot={{r:4,fill:"#10b981",strokeWidth:2,stroke:"#fff"}} activeDot={{r:6}}/>
                          </RechartsAreaChart>
                        </RechartsResponsiveContainer>
                      </div>
                    </div>

                    {/* Distribution Pie Chart */}
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:14}}>Activity Distribution</div>
                      <div style={{width:"100%",height:160}}>
                        <RechartsResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <RechartsPie 
                              data={reportData?.dailyTrend?.slice(-8).map((d:any,i:number)=>({name:d.label,value:d.count,fill:[meta.accent,"#6366f1","#f59e0b","#ef4444","#10b981","#ec4899","#8b5cf6","#06b6d4"][i%8]}))||[]} 
                              dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={4} strokeWidth={0}
                            >
                              {(reportData?.dailyTrend?.slice(-8)||[]).map((_:any,i:number)=>(
                                <RechartsCell key={i} fill={[meta.accent,"#6366f1","#f59e0b","#ef4444","#10b981","#ec4899","#8b5cf6","#06b6d4"][i%8]}/>
                              ))}
                            </RechartsPie>
                            <RechartsTooltip contentStyle={{borderRadius:8,border:"1px solid #e2e8f0",fontSize:10}}/>
                          </RechartsPieChart>
                        </RechartsResponsiveContainer>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 12px",marginTop:10}}>
                        {reportData?.dailyTrend?.slice(-8).map((d:any,i:number)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:9,color:"#64748b"}}>
                            <span style={{display:"flex",alignItems:"center",gap:5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                              <span style={{width:6,height:6,borderRadius:1,background:[meta.accent,"#6366f1","#f59e0b","#ef4444","#10b981","#ec4899","#8b5cf6","#06b6d4"][i%8],flexShrink:0}}/>
                              {d.label}
                            </span>
                            <span style={{fontWeight:700,color:"#1e293b"}}>{d.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* Bottom: Recent Activity for Reception */}
              {profile?.type === "RECEPTION" && (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18, marginTop: 18}}>
                  {/* Recent Appointments */}
                  <div className="sd2-card">
                    <div className="sd2-card-hd">
                      <span className="sd2-card-title"><CalendarDays size={15} color={meta.accent}/>Recent Appointments</span>
                      <span style={{fontSize:10,color:"#94a3b8"}}>{recentAppointments.length} most recent</span>
                    </div>
                    <div style={{padding:"10px 0"}}>
                      {recentAppointmentsLoading ? (
                        <div style={{padding:"32px",textAlign:"center",color:"#94a3b8",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                          <Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading...
                        </div>
                      ) : recentAppointments.length > 0 ? (
                        recentAppointments.map((a: any) => (
                          <div key={a.id} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 18px",borderBottom:"1px solid #f8fafc"}}>
                            <div style={{width:32,height:32,borderRadius:8,background:meta.lightBg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <User size={14} color={meta.accent}/>
                            </div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:12,fontWeight:600,color:"#1e293b"}}>{a.patient?.name}</div>
                              <div style={{fontSize:10,color:"#64748b"}}>{a.doctor?.name} · {a.timeSlot}</div>
                            </div>
                            <span style={{
                              fontSize:10,padding:"2px 8px",borderRadius:100,
                              background:STATUS_CFG[a.status]?.bg || "#f1f5f9",
                              color:STATUS_CFG[a.status]?.color || "#475569",
                              fontWeight:700,border:`1px solid ${STATUS_CFG[a.status]?.border || "#e2e8f0"}`
                            }}>
                              {STATUS_CFG[a.status]?.label || a.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div style={{padding:"32px",textAlign:"center",color:"#94a3b8",fontSize:12}}>No recent appointments found</div>
                      )}
                      {recentAppointments.length > 0 && (
                        <div style={{padding:"10px 18px",fontSize:11,color:meta.accent,fontWeight:600,cursor:"pointer"}} onClick={()=>setTab("appointments")}>View all appointments →</div>
                      )}
                    </div>
                  </div>

                  {/* Pending Billing Queue */}
                  <div className="sd2-card">
                    <div className="sd2-card-hd">
                      <span className="sd2-card-title"><Receipt size={15} color={meta.accent}/>Pending Bills</span>
                      <span style={{fontSize:10,color:"#94a3b8"}}>{pendingBillingQueue.length} pending</span>
                    </div>
                    <div style={{padding:"10px 0"}}>
                      {billingQueueLoading ? (
                        <div style={{padding:"32px",textAlign:"center",color:"#94a3b8",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                          <Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading...
                        </div>
                      ) : pendingBillingQueue.length > 0 ? (
                        pendingBillingQueue.slice(0, 5).map((item: any) => (
                          <div key={item.id} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 18px",borderBottom:"1px solid #f8fafc"}}>
                            <div style={{width:32,height:32,borderRadius:8,background:meta.lightBg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <IndianRupee size={14} color={meta.accent}/>
                            </div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:12,fontWeight:600,color:"#1e293b"}}>{item.patient?.name}</div>
                              <div style={{fontSize:10,color:"#64748b"}}>{item.doctor?.name} · {item.timeSlot}</div>
                            </div>
                            <div style={{textAlign: "right"}}>
                              <div style={{fontSize:11,fontWeight:700,color:"#1e293b"}}>₹{(item.bill?.total || item.consultationFee || 0).toLocaleString()}</div>
                              <div style={{
                                fontSize:10, 
                                fontWeight: 700,
                                color: meta.accent,
                                background: meta.lightBg,
                                padding: "2px 6px",
                                borderRadius: 4,
                                marginTop: 2,
                                display: "inline-block",
                                border: `1px solid ${meta.borderColor}`
                              }}>
                                {item.bill?.status === "PARTIALLY_PAID" ? "Partial" : "Pending"}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{padding:"32px",textAlign:"center",color:"#94a3b8",fontSize:12}}>No pending bills in queue</div>
                      )}
                      {pendingBillingQueue.length > 0 && (
                        <div style={{padding:"10px 18px",fontSize:11,color:meta.accent,fontWeight:600,cursor:"pointer"}} onClick={()=>setTab("billing")}>Go to billing queue →</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── CLINICAL_PROCEDURE: Status Chips + Full Referral Table ── */}
              {profile?.type === "CLINICAL_PROCEDURE" && (() => {
                const allRefs = [...queue, ...completedQueue];
                const q = overviewRefSearch.trim().toLowerCase();
                const filtered = q
                  ? allRefs.filter(r =>
                      (r.patient?.name||"").toLowerCase().includes(q) ||
                      (r.patient?.patientId||"").toLowerCase().includes(q) ||
                      (r.doctor?.name||"").toLowerCase().includes(q) ||
                      String(r.tokenNumber||"").includes(q)
                    )
                  : allRefs;

                const statusCounts: Record<string,number> = {};
                for (const r of allRefs) statusCounts[r.status] = (statusCounts[r.status]||0)+1;

                const statusChips = [
                  { key:"SCHEDULED",   label:"Scheduled",   bg:"#f8fafc", color:"#475569", border:"#e2e8f0" },
                  { key:"CONFIRMED",   label:"Confirmed",   bg:"#f0fdf4", color:"#16a34a", border:"#bbf7d0" },
                  { key:"IN_PROGRESS", label:"In Progress", bg:"#E6F4F4", color:"#0A6B70", border:"#B3E0E0" },
                  { key:"COMPLETED",   label:"Completed",   bg:"#f0fdf4", color:"#059669", border:"#a7f3d0" },
                  { key:"NO_SHOW",     label:"No Show",     bg:"#fff7ed", color:"#c2410c", border:"#fed7aa" },
                  { key:"CANCELLED",   label:"Cancelled",   bg:"#fff5f5", color:"#ef4444", border:"#fecaca" },
                ];

                return (
                  <>
                    {/* Status summary chips */}
                    <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:18}}>
                      {statusChips.map(sc=>(
                        <div key={sc.key} style={{background:"#fff",borderRadius:12,border:`1px solid ${statusCounts[sc.key]>0?sc.border:"#e2e8f0"}`,padding:"12px 14px",boxShadow:"0 1px 4px rgba(0,0,0,.03)"}}>
                          <div style={{fontSize:22,fontWeight:800,color:statusCounts[sc.key]>0?sc.color:"#cbd5e1",lineHeight:1}}>{statusCounts[sc.key]||0}</div>
                          <div style={{fontSize:10,color:"#64748b",marginTop:4,fontWeight:500}}>{sc.label}</div>
                          <div style={{height:3,borderRadius:3,marginTop:8,background:statusCounts[sc.key]>0?sc.color:"#e2e8f0",opacity:statusCounts[sc.key]>0?.7:.3}}/>
                        </div>
                      ))}
                    </div>

                    {/* Full referral table */}
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",boxShadow:"0 1px 6px rgba(0,0,0,.04)",overflow:"hidden"}}>
                      {/* Table header */}
                      <div style={{padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #f1f5f9",gap:12,flexWrap:"wrap"}}>
                        <span style={{fontSize:14,fontWeight:800,color:"#1e293b",display:"flex",alignItems:"center",gap:8}}>
                          <UserCheck size={16} color={meta.accent}/>All Referred Patients
                          <span style={{fontSize:11,fontWeight:600,color:meta.accent,background:meta.lightBg,border:`1px solid ${meta.borderColor}`,padding:"2px 8px",borderRadius:100}}>{allRefs.length}</span>
                        </span>
                        <div style={{display:"flex",alignItems:"center",gap:10,flex:1,justifyContent:"flex-end"}}>
                          <div style={{display:"flex",alignItems:"center",gap:7,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:9,padding:"7px 12px",minWidth:220}}>
                            <Search size={12} color="#94a3b8"/>
                            <input
                              placeholder="Search patient, doctor, token..."
                              value={overviewRefSearch}
                              onChange={e=>setOverviewRefSearch(e.target.value)}
                              style={{border:"none",outline:"none",background:"none",fontSize:12,color:"#334155",width:"100%",fontFamily:"inherit"}}
                            />
                            {overviewRefSearch && <button onClick={()=>setOverviewRefSearch("")} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}><X size={11} color="#94a3b8"/></button>}
                          </div>
                          {queueLoading && <Loader2 size={14} color={meta.accent} style={{animation:"spin .7s linear infinite"}}/>}
                          <button onClick={()=>{setTab("queue");loadQueue();}}
                            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:9,border:`1px solid ${meta.borderColor}`,background:meta.lightBg,color:meta.accent,fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
                            Queue Tab <ChevronRight size={13}/>
                          </button>
                        </div>
                      </div>

                      {/* Table */}
                      {queueLoading ? (
                        <div style={{padding:"48px",textAlign:"center",color:"#94a3b8",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                          <Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading referrals...
                        </div>
                      ) : filtered.length === 0 ? (
                        <div style={{padding:"56px 20px",textAlign:"center"}}>
                          <UserCheck size={40} color="#e2e8f0" style={{margin:"0 auto 12px"}}/>
                          <div style={{fontSize:13,fontWeight:600,color:"#94a3b8"}}>{overviewRefSearch ? "No results match your search" : "No referred patients yet"}</div>
                          <div style={{fontSize:11,color:"#cbd5e1",marginTop:4}}>Referrals appear here when doctors send patients to this department</div>
                        </div>
                      ) : (
                        <div style={{overflowX:"auto"}}>
                          <table style={{width:"100%",borderCollapse:"collapse"}}>
                            <thead>
                              <tr style={{background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
                                {["#","Patient","Referred By","Date","Time","Procedures","Status","Actions"].map(h=>(
                                  <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap"}}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {filtered.map((r:any, idx:number)=>{
                                const sc = STATUS_CFG[r.status] || { label:r.status, bg:"#f1f5f9", color:"#475569", border:"#e2e8f0" };
                                const apptDate = r.appointmentDate ? new Date(r.appointmentDate).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : "—";
                                return (
                                  <tr key={r.id} style={{borderBottom:"1px solid #f8fafc",transition:"background .1s"}}
                                    onMouseEnter={e=>(e.currentTarget.style.background="#fafbfc")}
                                    onMouseLeave={e=>(e.currentTarget.style.background="")}>
                                    <td style={{padding:"11px 14px",fontSize:11,color:"#94a3b8",fontWeight:600}}>{idx+1}</td>
                                    <td style={{padding:"11px 14px"}}>
                                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                                        <div style={{width:34,height:34,borderRadius:9,background:meta.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:"#fff",flexShrink:0}}>
                                          {(r.patient?.name||"P").charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                          <div style={{fontSize:12,fontWeight:700,color:"#1e293b"}}>{r.patient?.name||"—"}</div>
                                          <div style={{fontSize:10,color:"#94a3b8"}}>{r.patient?.patientId||""}{r.patient?.gender?` · ${r.patient.gender}`:""}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{padding:"11px 14px"}}>
                                      <div style={{fontSize:12,fontWeight:600,color:"#1e293b"}}>{r.doctor?.name||"—"}</div>
                                      <div style={{fontSize:10,color:"#94a3b8"}}>{r.doctor?.specialization||""}</div>
                                    </td>
                                    <td style={{padding:"11px 14px",fontSize:12,color:"#334155",fontWeight:600,whiteSpace:"nowrap"}}>{apptDate}</td>
                                    <td style={{padding:"11px 14px",fontSize:12,color:"#334155"}}>{r.timeSlot||"—"}</td>
                                    <td style={{padding:"11px 14px"}}>
                                      {r.suggestedProcedures?.length>0
                                        ? r.suggestedProcedures.slice(0,2).map((p:any,i:number)=>(
                                            <span key={i} style={{display:"inline-block",marginRight:3,marginBottom:2,padding:"2px 7px",borderRadius:100,background:(PROC_TYPE_COLOR[p.type]||"#94a3b8")+"18",color:PROC_TYPE_COLOR[p.type]||"#94a3b8",fontSize:10,fontWeight:700}}>{p.name}</span>
                                          ))
                                        : <span style={{fontSize:10,color:"#94a3b8"}}>—</span>
                                      }
                                    </td>
                                    <td style={{padding:"11px 14px"}}>
                                      <span style={{display:"inline-flex",alignItems:"center",padding:"3px 10px",borderRadius:100,background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`,fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{sc.label}</span>
                                    </td>
                                    <td style={{padding:"11px 14px"}} onClick={e=>e.stopPropagation()}>
                                      <div style={{display:"flex",gap:5}}>
                                        <button
                                          onClick={()=>setOverviewDetailItem(r)}
                                          style={{width:28,height:28,borderRadius:8,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#64748b",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
                                          title="View Details"><Eye size={13}/></button>
                                        {!["COMPLETED","CANCELLED","NO_SHOW"].includes(r.status) && (<>
                                          <button
                                            onClick={()=>{ setConsentUploadTarget(r); setConsentFile(null); setConsentUrl(""); setConsentUploadMsg(""); }}
                                            style={{width:28,height:28,borderRadius:8,border:"none",background:"#f0fdf4",color:"#16a34a",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
                                            title="Record Procedure (Consent First)"><Plus size={13}/></button>
                                          <button
                                            onClick={()=>{ setQueueProblemTarget(r); setQueueProblemForm({status:"NO_SHOW",remarks:"",rescheduleDate:"",rescheduleTime:""}); }}
                                            style={{width:28,height:28,borderRadius:8,border:"none",background:"#fff7ed",color:"#c2410c",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
                                            title="Mark No-Show / Problem"><AlertTriangle size={13}/></button>
                                          <button
                                            onClick={()=>{ setQueueProblemTarget(r); setQueueProblemForm({status:"RESCHEDULED",remarks:"",rescheduleDate:"",rescheduleTime:""}); }}
                                            style={{width:28,height:28,borderRadius:8,border:"none",background:"#eff6ff",color:"#2563eb",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
                                            title="Reschedule"><Edit2 size={13}/></button>
                                        </>)}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                      <div style={{padding:"10px 18px",borderTop:"1px solid #f1f5f9",fontSize:11,color:"#94a3b8",display:"flex",justifyContent:"space-between"}}>
                        <span>Showing {filtered.length} of {allRefs.length} referral{allRefs.length!==1?"s":""}</span>
                        <span>{queue.length} pending · {completedQueue.length} completed</span>
                      </div>
                    </div>

                    {/* View Detail Modal */}
                    {overviewDetailItem && (
                      <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
                        onClick={()=>setOverviewDetailItem(null)}>
                        <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:18,padding:28,width:"100%",maxWidth:520,border:"1px solid #e2e8f0",boxShadow:"0 20px 60px rgba(0,0,0,.14)",maxHeight:"90vh",overflowY:"auto"}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                            <div style={{fontSize:15,fontWeight:800,color:"#1e293b"}}>Referral Details</div>
                            <button onClick={()=>setOverviewDetailItem(null)} style={{width:30,height:30,borderRadius:8,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={13} color="#94a3b8"/></button>
                          </div>
                          {/* Patient card */}
                          <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:meta.lightBg,borderRadius:12,border:`1px solid ${meta.borderColor}`,marginBottom:16}}>
                            <div style={{width:46,height:46,borderRadius:12,background:meta.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,color:"#fff",flexShrink:0}}>
                              {(overviewDetailItem.patient?.name||"P").charAt(0).toUpperCase()}
                            </div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:14,fontWeight:800,color:"#1e293b"}}>{overviewDetailItem.patient?.name||"—"}</div>
                              <div style={{fontSize:11,color:"#64748b"}}>{overviewDetailItem.patient?.patientId||""}{overviewDetailItem.patient?.phone?` · ${overviewDetailItem.patient.phone}`:""}{overviewDetailItem.patient?.gender?` · ${overviewDetailItem.patient.gender}`:""}</div>
                            </div>
                            {(() => { const sc2=STATUS_CFG[overviewDetailItem.status]||{label:overviewDetailItem.status,bg:"#f1f5f9",color:"#475569",border:"#e2e8f0"}; return <span style={{padding:"4px 12px",borderRadius:100,background:sc2.bg,color:sc2.color,border:`1px solid ${sc2.border}`,fontSize:11,fontWeight:700}}>{sc2.label}</span>; })()}
                          </div>
                          {/* Info grid */}
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                            {[
                              ["Referred By", overviewDetailItem.doctor?.name||"—"],
                              ["Specialization", overviewDetailItem.doctor?.specialization||"—"],
                              ["Appointment Date", overviewDetailItem.appointmentDate ? new Date(overviewDetailItem.appointmentDate).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—"],
                              ["Time Slot", overviewDetailItem.timeSlot||"—"],
                              ["Token No.", overviewDetailItem.tokenNumber||"—"],
                              ["Type", overviewDetailItem.type||"—"],
                            ].map(([k,v])=>(
                              <div key={k} style={{background:"#f8fafc",borderRadius:9,padding:"10px 12px",border:"1px solid #f1f5f9"}}>
                                <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:".04em"}}>{k}</div>
                                <div style={{fontSize:12,fontWeight:600,color:"#334155",marginTop:2}}>{v}</div>
                              </div>
                            ))}
                          </div>
                          {/* Referral notes */}
                          {overviewDetailItem.subDeptNote && (
                            <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:"12px 14px",marginBottom:16}}>
                              <div style={{fontSize:10,fontWeight:700,color:"#16a34a",marginBottom:5,textTransform:"uppercase",letterSpacing:".04em"}}>Referral Instructions</div>
                              <div style={{fontSize:12,color:"#334155",lineHeight:1.7}}>{overviewDetailItem.subDeptNote}</div>
                            </div>
                          )}
                          {/* Suggested procedures */}
                          {overviewDetailItem.suggestedProcedures?.length>0 && (
                            <div style={{marginBottom:16}}>
                              <div style={{fontSize:10,fontWeight:700,color:"#475569",marginBottom:8,textTransform:"uppercase",letterSpacing:".04em"}}>Suggested Procedures</div>
                              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                                {overviewDetailItem.suggestedProcedures.map((p:any,i:number)=>(
                                  <div key={i} style={{padding:"6px 12px",borderRadius:9,background:(PROC_TYPE_COLOR[p.type]||"#94a3b8")+"14",border:`1px solid ${(PROC_TYPE_COLOR[p.type]||"#94a3b8")}30`,display:"flex",alignItems:"center",gap:6}}>
                                    <span style={{fontSize:11,fontWeight:700,color:PROC_TYPE_COLOR[p.type]||"#94a3b8"}}>{p.name}</span>
                                    {p.fee!=null && <span style={{fontSize:10,color:"#64748b"}}>₹{p.fee}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Action buttons */}
                          {!["COMPLETED","CANCELLED","NO_SHOW"].includes(overviewDetailItem.status) && (
                            <div style={{display:"flex",gap:8,justifyContent:"flex-end",paddingTop:14,borderTop:"1px solid #f1f5f9"}}>
                              <button onClick={()=>{ setOverviewDetailItem(null); setConsentUploadTarget(overviewDetailItem); setConsentFile(null); setConsentUrl(""); setConsentUploadMsg(""); }}
                                style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:10,border:"none",background:"#f0fdf4",color:"#16a34a",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                                <Plus size={13}/>Record Procedure
                              </button>
                              <button onClick={()=>{ setOverviewDetailItem(null); setQueueProblemTarget(overviewDetailItem); setQueueProblemForm({status:"NO_SHOW",remarks:"",rescheduleDate:"",rescheduleTime:""}); }}
                                style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:10,border:"none",background:"#fff7ed",color:"#c2410c",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                                <AlertTriangle size={13}/>Mark Issue
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Bottom: Procedures preview + HOD (For Non-Reception, Non-Clinical-Procedure) */}
              {profile?.type !== "RECEPTION" && profile?.type !== "CLINICAL_PROCEDURE" && (
                <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:18}}>
                  <div className="sd2-card">
                    <div className="sd2-card-hd">
                      <span className="sd2-card-title"><ClipboardList size={15} color={meta.accent}/>Procedure Catalog</span>
                      <span style={{fontSize:10,color:"#94a3b8"}}>{activeProcs.length} active / {procs.length} total</span>
                    </div>
                    <div style={{padding:"10px 0"}}>
                      {displayProcs.slice(0,6).map((p:any)=>(
                        <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 18px",borderBottom:"1px solid #f8fafc"}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:PROC_TYPE_COLOR[p.type]||"#94a3b8",flexShrink:0}}/>
                          <div style={{flex:1,fontSize:12,fontWeight:500,color:p.isActive?"#334155":"#94a3b8"}}>{p.name}</div>
                          <span style={{fontSize:10,padding:"2px 7px",borderRadius:100,background:(PROC_TYPE_COLOR[p.type]||"#94a3b8")+"18",color:PROC_TYPE_COLOR[p.type]||"#94a3b8",fontWeight:700}}>{p.type}</span>
                          {p.fee!=null && <span style={{fontSize:10,fontWeight:700,color:"#10b981",minWidth:40,textAlign:"right"}}>₹{p.fee}</span>}
                        </div>
                      ))}
                      {displayProcs.length>6 && <div style={{padding:"10px 18px",fontSize:11,color:meta.accent,fontWeight:600,cursor:"pointer"}} onClick={()=>setTab("procedures")}>View all {displayProcs.length} procedures →</div>}
                      {displayProcs.length===0 && <div style={{padding:"32px",textAlign:"center",color:"#94a3b8",fontSize:12}}>No procedures configured yet</div>}
                    </div>
                  </div>
                  
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    {/* HOD */}
                    <div className="sd2-card">
                      <div className="sd2-card-hd"><span className="sd2-card-title"><User size={14} color={meta.accent}/>Head of Department</span></div>
                      <div style={{padding:"16px"}}>
                        {profile?.hodName ? (<>
                          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                            <div style={{width:46,height:46,borderRadius:12,background:meta.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:"#fff"}}>{initials(profile.hodName)}</div>
                            <div>
                              <div style={{fontSize:13,fontWeight:700,color:"#1e293b"}}>{profile.hodName}</div>
                              <div style={{fontSize:10,color:"#94a3b8"}}>Head of Department</div>
                            </div>
                          </div>
                          {profile.hodEmail && <div style={{display:"flex",alignItems:"center",gap:7,fontSize:11,color:"#64748b",marginBottom:6}}><Mail size={11}/>{profile.hodEmail}</div>}
                          {profile.hodPhone && <div style={{display:"flex",alignItems:"center",gap:7,fontSize:11,color:"#64748b"}}><Phone size={11}/>{profile.hodPhone}</div>}
                        </>) : <div style={{padding:"20px 0",textAlign:"center",color:"#94a3b8",fontSize:12}}>No HOD assigned</div>}
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div style={{background:meta.lightBg,borderRadius:12,border:`1px solid ${meta.borderColor}`,padding:"14px 16px"}}>
                      <div style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>Department Details</div>
                      {[
                        ["Type",        profile?.type?.replace(/_/g," ")],
                        ["Code",        profile?.code || "—"],
                        ["Parent Dept", profile?.department?.name || "Independent"],
                      ].map(([k,v])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:7}}>
                          <span style={{color:"#64748b"}}>{k}</span>
                          <span style={{fontWeight:600,color:"#1e293b"}}>{v}</span>
                        </div>
                      ))}
                      <div style={{borderTop:`1px solid ${meta.borderColor}`,paddingTop:8,marginTop:4,fontSize:10,color:"#94a3b8"}}>
                        Login: {profile?.loginEmail || user?.email || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Upcoming Treatment Plans */}
              {profile?.type !== "RECEPTION" && profile?.type !== "CLINICAL_PROCEDURE" && (
                <div className="sd2-card" style={{marginTop:18}}>
                  <div className="sd2-card-hd">
                    <span className="sd2-card-title"><Activity size={15} color={meta.accent}/>Active Treatment Plans</span>
                    <span style={{fontSize:10,color:"#94a3b8"}}>{upcomingSessions.length} active plan{upcomingSessions.length!==1?"s":""}</span>
                  </div>
                  {sessionsLoading ? (
                    <div style={{padding:"28px",textAlign:"center",color:"#94a3b8",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                      <Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading sessions...
                    </div>
                  ) : upcomingSessions.length===0 ? (
                    <div style={{padding:"28px",textAlign:"center",color:"#94a3b8",fontSize:12}}>No active treatment plans for this department</div>
                  ) : (
                    <div style={{padding:"8px 0"}}>
                      {upcomingSessions.map((plan:any) => {
                        const pct = plan.totalSessions>0 ? (plan.completedSessions/plan.totalSessions)*100 : 0;
                        return (
                          <div key={plan.id} style={{display:"flex",alignItems:"center",gap:14,padding:"10px 18px",borderBottom:"1px solid #f8fafc"}}>
                            <div style={{width:36,height:36,borderRadius:10,background:meta.lightBg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <Activity size={16} color={meta.accent}/>
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:12,fontWeight:600,color:"#1e293b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{plan.planName}</div>
                              <div style={{fontSize:10,color:"#64748b"}}>{plan.patient?.name} · {plan.patient?.patientId}</div>
                              <div style={{marginTop:5,height:4,background:"#f1f5f9",borderRadius:100,overflow:"hidden"}}>
                                <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${meta.accent},#10b981)`,borderRadius:100}}/>
                              </div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0}}>
                              <div style={{fontSize:11,fontWeight:700,color:"#1e293b"}}>{plan.completedSessions}/{plan.totalSessions}</div>
                              <div style={{fontSize:10,color:"#94a3b8"}}>sessions</div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0}}>
                              <div style={{fontSize:11,fontWeight:700,color:"#10b981"}}>₹{(plan.paidAmount||0).toLocaleString()}</div>
                              <div style={{fontSize:10,color:"#94a3b8"}}>of ₹{(plan.totalCost||0).toLocaleString()}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>)}

            {/* ═══════════════════ DOCTOR REFERRALS QUEUE ═══════════════════ */}
            {tab==="queue" && (<>
              {/* Toolbar — matches hospitaladmin/appointments style */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"8px 14px",flex:1,minWidth:200}}>
                  <input style={{background:"none",border:"none",outline:"none",fontSize:12,color:"#334155",width:"100%",fontFamily:"inherit"}}
                    placeholder="Search by patient, token, doctor..." value={queueSearch} onChange={e=>setQueueSearch(e.target.value)}/>
                  {queueSearch && <button onClick={()=>setQueueSearch("")} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}><X size={12} color="#94a3b8"/></button>}
                </div>
                {queueLoading && <Loader2 size={16} color={meta.accent} style={{animation:"spin .7s linear infinite"}}/>}
                <div style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>{filteredQueue.length} referrals</div>
                {/* Export Dropdown */}
                <div style={{position:"relative",marginLeft:"auto"}}>
                  <button onClick={()=>setQueueExportOpen(!queueExportOpen)}
                    style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:500,cursor:"pointer"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="#cbd5e1";e.currentTarget.style.background="#f8fafc";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.background="#fff";}}>
                    <Download size={14}/>Export
                  </button>
                  {queueExportOpen && (<>
                    <div style={{position:"fixed",inset:0,zIndex:60}} onClick={()=>setQueueExportOpen(false)}/>
                    <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,zIndex:70,minWidth:180,padding:6}}>
                      <button onClick={exportQueuePDF} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:8,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:12,color:"#334155",fontWeight:500}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <span style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:"#fff5f5",color:"#ef4444"}}><FileText size={13}/></span>Export as PDF
                      </button>
                      <button onClick={exportQueueExcel} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:8,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:12,color:"#334155",fontWeight:500}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <span style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:"#f0fdf4",color:"#16a34a"}}><FileSpreadsheet size={13}/></span>Export as Excel
                      </button>
                      <button onClick={exportQueueWord} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:8,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:12,color:"#334155",fontWeight:500}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <span style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:"#eff6ff",color:"#2563eb"}}><FileType size={13}/></span>Export as Word
                      </button>
                    </div>
                  </>)}
                </div>
                <button onClick={loadQueue}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"9px 20px",borderRadius:10,border:"none",background:meta.gradient,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
                  <RefreshCw size={15} style={queueLoading?{animation:"spin .7s linear infinite"}:{}}/>Refresh
                </button>
              </div>

              {/* Queue Table */}
              {queueLoading && queue.length===0 ? (
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"60px 0",color:"#94a3b8"}}>
                  <Loader2 size={20} style={{animation:"spin .7s linear infinite"}}/>Loading referrals...
                </div>
              ) : filteredQueue.length===0 ? (
                <div style={{textAlign:"center",padding:"60px 20px",background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",color:"#94a3b8"}}>
                  <UserCheck size={32} style={{marginBottom:10,opacity:.4}}/>
                  <div style={{fontSize:13,fontWeight:600}}>No referrals for today</div>
                  <div style={{fontSize:11,color:"#cbd5e1",marginTop:4}}>Patients will appear here after a doctor completes their consultation and refers to <strong>{deptName}</strong></div>
                </div>
              ) : (
                <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden"}}>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead>
                        <tr style={{background:"#f8fafc"}}>
                          <th style={{padding:"12px 10px 12px 14px",borderBottom:"2px solid #f1f5f9",width:36}}>
                            <input type="checkbox" checked={filteredQueue.length>0 && selectedQueue.size===filteredQueue.length} onChange={toggleSelectAllQueue}
                              style={{width:15,height:15,cursor:"pointer",accentColor:meta.accent}}/>
                          </th>
                          {["Token","Patient","Referred On","Referred By","Referral Note","Suggested Procedures","Actions"].map(h=>(
                            <th key={h} style={{textAlign:"left",fontSize:10,fontWeight:600,color:"#94a3b8",padding:"12px 14px",borderBottom:"2px solid #f1f5f9",whiteSpace:"nowrap"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQueue.map((q:any)=>{
                          const exp = expandedRow===q.id;
                          const isSelected = selectedQueue.has(q.id);
                          return (
                            <React.Fragment key={q.id}>
                              <tr style={{borderBottom:"1px solid #f8fafc",background:isSelected?meta.lightBg:"transparent",cursor:"pointer"}}
                                onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.background="#fafbfc";}}
                                onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.background="transparent";}}
                                onClick={()=>setExpandedRow(exp?null:q.id)}>
                                <td style={{padding:"12px 10px 12px 14px",width:36}} onClick={e=>e.stopPropagation()}>
                                  <input type="checkbox" checked={isSelected} onChange={()=>toggleSelectQueue(q.id)}
                                    style={{width:15,height:15,cursor:"pointer",accentColor:meta.accent}}/>
                                </td>
                                <td style={{padding:"12px 14px"}}>
                                  <div style={{width:34,height:34,borderRadius:10,background:meta.lightBg,border:`1.5px solid ${meta.borderColor}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:meta.accent}}>
                                    {q.tokenNumber||"—"}
                                  </div>
                                </td>
                                <td style={{padding:"12px 14px"}}>
                                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                                    <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#0ea5e9,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11,color:"#fff",flexShrink:0}}>
                                      {(q.patient?.name||"P").charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div style={{fontSize:12,fontWeight:600,color:"#1e293b"}}>{q.patient?.name||"Unknown"}</div>
                                      <div style={{fontSize:10,color:"#94a3b8"}}>{q.patient?.patientId||""}{q.patient?.age ? ` · ${q.patient.age}y` : ""}{q.patient?.gender ? ` · ${q.patient.gender.charAt(0)}` : ""}</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{padding:"12px 14px"}}>
                                  <div style={{fontSize:11,fontWeight:600,color:"#334155"}}>{q.appointmentDate ? new Date(q.appointmentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}</div>
                                  <div style={{fontSize:10,color:"#94a3b8"}}>{q.timeSlot||"—"}</div>
                                </td>
                                <td style={{padding:"12px 14px"}}>
                                  <div style={{fontSize:11,fontWeight:600,color:"#334155"}}>{q.doctor?.name||"—"}</div>
                                  <div style={{fontSize:10,color:"#94a3b8"}}>{q.doctor?.specialization||q.doctor?.department||""}</div>
                                </td>
                                <td style={{padding:"12px 14px",maxWidth:200}}>
                                  {q.subDeptNote
                                    ? <div style={{fontSize:11,color:"#166534",background:"#f0fdf4",borderRadius:7,padding:"5px 8px",border:"1px solid #bbf7d0",lineHeight:1.4}}><MessageSquare size={10} style={{marginRight:5,verticalAlign:"middle",color:"#16a34a"}}/>{q.subDeptNote}</div>
                                    : q.doctorNotes
                                      ? <div style={{fontSize:11,color:"#64748b",fontStyle:"italic"}}>{q.doctorNotes.slice(0,60)}{q.doctorNotes.length>60?"…":""}</div>
                                      : <span style={{fontSize:10,color:"#94a3b8"}}>—</span>
                                  }
                                </td>
                                <td style={{padding:"12px 14px"}}>
                                  {q.suggestedProcedures?.length>0
                                    ? q.suggestedProcedures.map((p:any,i:number)=>(
                                      <span key={i} style={{display:"inline-block",marginRight:4,marginBottom:2,padding:"2px 8px",borderRadius:100,background:(PROC_TYPE_COLOR[p.type]||"#94a3b8")+"18",color:PROC_TYPE_COLOR[p.type]||"#94a3b8",fontSize:10,fontWeight:700}}>{p.name}</span>
                                    ))
                                    : <span style={{fontSize:10,color:"#94a3b8"}}>—</span>
                                  }
                                </td>
                                <td style={{padding:"12px 14px"}} onClick={e=>e.stopPropagation()}>
                                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                                    <button
                                      onClick={()=>{ setConsentUploadTarget(q); setConsentFile(null); setConsentUrl(""); setConsentUploadMsg(""); }}
                                      style={{width:28,height:28,borderRadius:8,border:"none",background:"#f0fdf4",color:"#16a34a",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
                                      title="Record Procedure (Upload Consent First)"><Plus size={13}/></button>
                                    <button onClick={()=>setExpandedRow(exp?null:q.id)}
                                      style={{width:28,height:28,borderRadius:8,border:"none",background:"#f8fafc",color:"#64748b",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
                                      title={exp?"Hide Details":"View Details"}><Eye size={13}/></button>
                                    <button
                                      onClick={()=>{ setQueueProblemTarget(q); setQueueProblemForm({ status:"NO_SHOW", remarks:"", rescheduleDate:"", rescheduleTime:"" }); }}
                                      style={{width:28,height:28,borderRadius:8,border:"none",background:"#fff7ed",color:"#c2410c",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
                                      title="Mark No-Show / Problem"><AlertTriangle size={13}/></button>
                                    <button
                                      onClick={()=>{ setQueueProblemTarget(q); setQueueProblemForm({ status:"RESCHEDULED", remarks:"", rescheduleDate:"", rescheduleTime:"" }); }}
                                      style={{width:28,height:28,borderRadius:8,border:"none",background:"#eff6ff",color:"#2563eb",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
                                      title="Edit / Reschedule"><Edit2 size={13}/></button>
                                  </div>
                                </td>
                              </tr>

                              {exp && (
                                <tr>
                                  <td colSpan={8} style={{padding:0}}>
                                    <div style={{background:"#fafbfc",padding:"18px 20px",borderBottom:"1px solid #f1f5f9"}}>
                                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                                        <div>
                                          <div style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8,display:"flex",alignItems:"center",gap:6}}><Stethoscope size={12} color={meta.accent}/>Doctor&apos;s Consultation Notes</div>
                                          <div style={{background:"#fff",borderRadius:10,border:`1px solid ${meta.borderColor}`,padding:"12px 14px",fontSize:12,color:"#334155",lineHeight:1.6,minHeight:56}}>
                                            {q.doctorNotes ? q.doctorNotes : <span style={{color:"#94a3b8",fontStyle:"italic"}}>No consultation notes</span>}
                                          </div>
                                          {q.subDeptNote && (
                                            <div style={{marginTop:10,background:"#f0fdf4",borderRadius:10,border:"1.5px solid #bbf7d0",padding:"12px 14px"}}>
                                              <div style={{fontSize:10,fontWeight:700,color:"#16a34a",marginBottom:5,display:"flex",alignItems:"center",gap:5}}><MessageSquare size={11}/>Referral Instructions</div>
                                              <div style={{fontSize:12,color:"#166534",lineHeight:1.6}}>{q.subDeptNote}</div>
                                            </div>
                                          )}
                                          <div style={{marginTop:10,display:"flex",gap:10}}>
                                            {[["Type",q.type],["Fee",q.consultationFee?`₹${q.consultationFee}`:"—"],["Phone",q.patient?.phone||"—"]].map(([k,v])=>(
                                              <div key={k} style={{flex:1,background:"#fff",borderRadius:9,padding:"8px 10px",border:"1px solid #e2e8f0",textAlign:"center"}}>
                                                <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,marginBottom:2}}>{k}</div>
                                                <div style={{fontSize:11,fontWeight:700,color:"#334155"}}>{v}</div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                        <div>
                                          <div style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8,display:"flex",alignItems:"center",gap:6}}><TrendingUp size={12} color={meta.accent}/>Patient Journey</div>
                                          {profile?.flow ? (
                                            <div style={{background:"#fff",borderRadius:10,border:`1px solid ${meta.borderColor}`,padding:"12px 14px"}}>
                                              {profile.flow.split("→").map((step:string,i:number,arr:string[])=>{
                                                const isHere = step.trim().toLowerCase().includes(deptName.split(" ")[0].toLowerCase());
                                                return (
                                                  <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:i<arr.length-1?8:0}}>
                                                    <div style={{width:22,height:22,borderRadius:"50%",background:isHere?meta.gradient:"#f1f5f9",border:`2px solid ${isHere?meta.accent:"#e2e8f0"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                                      <span style={{fontSize:9,fontWeight:800,color:isHere?"#fff":"#94a3b8"}}>{i+1}</span>
                                                    </div>
                                                    <span style={{fontSize:11,fontWeight:isHere?700:500,color:isHere?meta.accent:"#64748b"}}>{step.trim()}</span>
                                                    {isHere && <span style={{marginLeft:"auto",fontSize:9,padding:"1px 6px",borderRadius:100,background:meta.lightBg,color:meta.accent,fontWeight:700,border:`1px solid ${meta.borderColor}`}}>HERE</span>}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          ) : (
                                            <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:"12px 14px",color:"#94a3b8",fontSize:11}}>
                                              OPD → <strong style={{color:meta.accent}}>{deptName}</strong> → Billing
                                            </div>
                                          )}
                                        </div>
                                      </div>
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
                  {/* Footer */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderTop:"1px solid #f1f5f9"}}>
                    <div style={{fontSize:11,color:"#94a3b8"}}>Showing {filteredQueue.length} of {queue.length} referrals</div>
                    {selectedQueue.size > 0 && <div style={{fontSize:10,color:meta.accent,fontWeight:600}}>{selectedQueue.size} selected</div>}
                  </div>
                </div>
              )}

              {/* ═══════════════════ DIRECT APPOINTMENTS ═══════════════════ */}
              {directQueue.length > 0 && (<>
                <div style={{marginTop:28,marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
                  <CalendarDays size={16} color="#0E898F"/>
                  <span style={{fontSize:14,fontWeight:700,color:"#1e293b"}}>Direct Appointments</span>
                  <span style={{fontSize:10,fontWeight:600,background:"#E6F4F4",padding:"2px 10px",borderRadius:100,border:`1px solid #B3E0E0`,color:"#0A6B70"}}>{directQueue.length}</span>
                  <span style={{fontSize:11,color:"#94a3b8",marginLeft:4}}>Booked directly via reception/staff</span>
                </div>
                {/* Search */}
                <div style={{display:"flex",alignItems:"center",gap:8,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"8px 14px",marginBottom:12,maxWidth:350}}>
                  <Search size={13} color="#94a3b8"/>
                  <input style={{background:"none",border:"none",outline:"none",fontSize:12,color:"#334155",width:"100%",fontFamily:"inherit"}}
                    placeholder="Search direct appointments..." value={directQueueSearch} onChange={e=>setDirectQueueSearch(e.target.value)}/>
                  {directQueueSearch && <button onClick={()=>setDirectQueueSearch("")} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}><X size={12} color="#94a3b8"/></button>}
                </div>
                {(()=>{
                  const filtered = directQueueSearch
                    ? directQueue.filter((d:any) => d.patient?.name?.toLowerCase().includes(directQueueSearch.toLowerCase()) || d.patient?.patientId?.toLowerCase().includes(directQueueSearch.toLowerCase()))
                    : directQueue;
                  return filtered.length === 0 ? (
                    <div style={{textAlign:"center",padding:"30px 20px",background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",color:"#94a3b8",fontSize:12}}>No matches</div>
                  ) : (
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden"}}>
                      <div style={{overflowX:"auto"}}>
                        <table style={{width:"100%",borderCollapse:"collapse"}}>
                          <thead>
                            <tr style={{background:"#f8fafc"}}>
                              {["Patient","Appointment Date","Time","Status","Notes","Actions"].map(h=>(
                                <th key={h} style={{textAlign:"left",fontSize:10,fontWeight:600,color:"#94a3b8",padding:"12px 14px",borderBottom:"2px solid #f1f5f9",whiteSpace:"nowrap"}}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((d:any)=>(
                              <tr key={d.id} style={{borderBottom:"1px solid #f8fafc"}}
                                onMouseEnter={e=>{e.currentTarget.style.background="#fafbfc";}}
                                onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                                <td style={{padding:"12px 14px"}}>
                                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                                    <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#0E898F,#0A6B70)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:11,flexShrink:0}}>
                                      {(d.patient?.name||"?").charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div style={{fontSize:12,fontWeight:700,color:"#1e293b"}}>{d.patient?.name||"Unknown"}</div>
                                      <div style={{fontSize:10,color:"#94a3b8"}}>{d.patient?.patientId} · {d.patient?.gender||""}{d.patient?.age ? ` · ${d.patient.age}y` : ""}</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{padding:"12px 14px",fontSize:12,color:"#334155"}}>
                                  {d.appointmentDate ? new Date(d.appointmentDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—"}
                                </td>
                                <td style={{padding:"12px 14px",fontSize:12,color:"#334155"}}>
                                  {d.timeSlot ? (()=>{const [h,m]=d.timeSlot.split(":").map(Number);return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`;})() : <span style={{color:"#94a3b8",fontStyle:"italic"}}>Walk-in</span>}
                                </td>
                                <td style={{padding:"12px 14px"}}>
                                  <span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:100,background:d.status==="CONFIRMED"?"#f0fdf4":"#f8fafc",color:d.status==="CONFIRMED"?"#16a34a":"#64748b",border:`1px solid ${d.status==="CONFIRMED"?"#bbf7d0":"#e2e8f0"}`}}>
                                    {d.status}
                                  </span>
                                </td>
                                <td style={{padding:"12px 14px",fontSize:11,color:"#64748b",maxWidth:200}}>
                                  {d.doctorNotes||d.subDeptNote||<span style={{color:"#cbd5e1"}}>—</span>}
                                </td>
                                <td style={{padding:"12px 14px"}}>
                                  <button onClick={()=>setRecordingFor(d)}
                                    style={{padding:"6px 14px",borderRadius:8,border:"none",background:meta.gradient,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
                                    <Plus size={11}/>Record
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </>)}

              {/* ═══════════════════ COMPLETED REFERRALS ═══════════════════ */}
              {completedQueue.length > 0 && (<>
                <div style={{marginTop:28,marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
                  <CheckCircle size={16} color="#16a34a"/>
                  <span style={{fontSize:14,fontWeight:700,color:"#1e293b"}}>Completed Procedures</span>
                  <span style={{fontSize:10,fontWeight:600,background:"#f0fdf4",padding:"2px 10px",borderRadius:100,border:"1px solid #bbf7d0",color:"#16a34a"}}>{completedQueue.length}</span>
                </div>
                {/* Search */}
                <div style={{display:"flex",alignItems:"center",gap:8,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"8px 14px",marginBottom:12,maxWidth:350}}>
                  <input style={{background:"none",border:"none",outline:"none",fontSize:12,color:"#334155",width:"100%",fontFamily:"inherit"}}
                    placeholder="Search completed..." value={completedQueueSearch} onChange={e=>setCompletedQueueSearch(e.target.value)}/>
                  {completedQueueSearch && <button onClick={()=>setCompletedQueueSearch("")} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}><X size={12} color="#94a3b8"/></button>}
                </div>
                {(()=>{
                  const filtered = completedQueueSearch
                    ? completedQueue.filter((c:any) => c.patient?.name?.toLowerCase().includes(completedQueueSearch.toLowerCase()) || c.patient?.patientId?.toLowerCase().includes(completedQueueSearch.toLowerCase()) || c.doctor?.name?.toLowerCase().includes(completedQueueSearch.toLowerCase()))
                    : completedQueue;
                  return filtered.length === 0 ? (
                    <div style={{textAlign:"center",padding:"30px 20px",background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",color:"#94a3b8",fontSize:12}}>No matches</div>
                  ) : (
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden"}}>
                      <div style={{overflowX:"auto"}}>
                        <table style={{width:"100%",borderCollapse:"collapse"}}>
                          <thead>
                            <tr style={{background:"#f0fdf4"}}>
                              {["Token","Patient","Referred By","Procedure Done","Amount","Performed By","Date","Actions"].map(h=>(
                                <th key={h} style={{textAlign:"left",fontSize:10,fontWeight:600,color:"#16a34a",padding:"12px 14px",borderBottom:"2px solid #bbf7d0",whiteSpace:"nowrap"}}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((c:any)=>(
                              <tr key={c.id} style={{borderBottom:"1px solid #f8fafc"}}
                                onMouseEnter={e=>e.currentTarget.style.background="#fafbfc"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                <td style={{padding:"12px 14px"}}>
                                  <div style={{width:34,height:34,borderRadius:10,background:"#f0fdf4",border:"1.5px solid #bbf7d0",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:"#16a34a"}}>
                                    {c.tokenNumber||"—"}
                                  </div>
                                </td>
                                <td style={{padding:"12px 14px"}}>
                                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                                    <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#22c55e,#16a34a)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11,color:"#fff",flexShrink:0}}>
                                      {(c.patient?.name||"P").charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div style={{fontSize:12,fontWeight:600,color:"#1e293b"}}>{c.patient?.name||"—"}</div>
                                      <div style={{fontSize:10,color:"#94a3b8"}}>{c.patient?.patientId||""}{c.patient?.phone?` · ${c.patient.phone}`:""}</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{padding:"12px 14px"}}>
                                  <div style={{fontSize:11,fontWeight:600,color:"#334155"}}>{c.doctor?.name||"—"}</div>
                                  <div style={{fontSize:10,color:"#94a3b8"}}>{c.doctor?.specialization||""}</div>
                                </td>
                                <td style={{padding:"12px 14px"}}>
                                  {c.procedureRecords?.length > 0
                                    ? c.procedureRecords.map((pr:any,i:number)=>(
                                      <span key={i} style={{display:"inline-block",marginRight:4,marginBottom:2,padding:"2px 8px",borderRadius:100,background:(PROC_TYPE_COLOR[pr.procedureType]||"#94a3b8")+"18",color:PROC_TYPE_COLOR[pr.procedureType]||"#94a3b8",fontSize:10,fontWeight:700}}>{pr.procedureName}</span>
                                    ))
                                    : <span style={{fontSize:10,color:"#94a3b8"}}>—</span>
                                  }
                                </td>
                                <td style={{padding:"12px 14px",fontWeight:700,color:"#0A6B70",fontSize:12}}>
                                  {c.procedureRecords?.length > 0 ? `₹${c.procedureRecords.reduce((s:number,pr:any)=>s+(pr.amount||0),0)}` : "—"}
                                </td>
                                <td style={{padding:"12px 14px",fontSize:12,color:"#64748b"}}>
                                  {c.procedureRecords?.[0]?.performedBy || "—"}
                                </td>
                                <td style={{padding:"12px 14px",fontSize:11,color:"#64748b",whiteSpace:"nowrap"}}>
                                  {c.procedureRecords?.[0]?.performedAt
                                    ? new Date(c.procedureRecords[0].performedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"})
                                    : c.appointmentDate ? new Date(c.appointmentDate).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : "—"}
                                </td>
                                <td style={{padding:"12px 14px"}}>
                                  <div style={{display:"flex",gap:6}}>
                                    <button onClick={()=>setViewCompletedItem(c)} style={{width:28,height:28,borderRadius:8,border:"none",background:"#f0fdf4",color:"#16a34a",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="View"><Eye size={13}/></button>
                                    <button onClick={()=>openEditCompleted(c)} style={{width:28,height:28,borderRadius:8,border:"none",background:"#E6F4F4",color:"#0E898F",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="Edit"><Edit2 size={13}/></button>
                                    <button onClick={()=>setDeleteCompletedTarget(c)} style={{width:28,height:28,borderRadius:8,border:"none",background:"#fff5f5",color:"#ef4444",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="Delete"><Trash2 size={13}/></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{padding:"12px 16px",borderTop:"1px solid #f1f5f9",fontSize:11,color:"#94a3b8"}}>
                        {filtered.length} completed procedure{filtered.length!==1?"s":""}
                      </div>
                    </div>
                  );
                })()}
              </>)}

              {/* ── Problem / No-show Modal ── */}
              {queueProblemTarget && (
                <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.55)",backdropFilter:"blur(4px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
                  onClick={()=>setQueueProblemTarget(null)}>
                  <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:18,padding:28,width:"100%",maxWidth:460,border:"1px solid #e2e8f0",boxShadow:"0 20px 60px rgba(0,0,0,.15)"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:36,height:36,borderRadius:10,background:"#fff7ed",border:"1.5px solid #fed7aa",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <AlertTriangle size={16} color="#c2410c"/>
                        </div>
                        <div>
                          <div style={{fontSize:14,fontWeight:800,color:"#1e293b"}}>Mark Patient Issue</div>
                          <div style={{fontSize:11,color:"#94a3b8"}}>{queueProblemTarget.patient?.name} · {queueProblemTarget.patient?.patientId}</div>
                        </div>
                      </div>
                      <button onClick={()=>setQueueProblemTarget(null)} style={{width:30,height:30,borderRadius:8,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={13} color="#94a3b8"/></button>
                    </div>

                    <div style={{marginBottom:16}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#475569",marginBottom:8,textTransform:"uppercase",letterSpacing:".05em"}}>Reason / Status</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        {[
                          { value:"NO_SHOW",    label:"No Show",          bg:"#fff7ed", color:"#c2410c", border:"#fed7aa" },
                          { value:"CANCELLED",  label:"Patient Cancelled", bg:"#fff5f5", color:"#ef4444", border:"#fecaca" },
                          { value:"RESCHEDULED",label:"Reschedule",        bg:"#eff6ff", color:"#2563eb", border:"#bfdbfe" },
                          { value:"CONFIRMED",  label:"Arrived (Confirm)", bg:"#f0fdf4", color:"#16a34a", border:"#bbf7d0" },
                        ].map(opt=>(
                          <button key={opt.value}
                            onClick={()=>setQueueProblemForm(f=>({...f,status:opt.value}))}
                            style={{padding:"10px 12px",borderRadius:10,border:`2px solid ${queueProblemForm.status===opt.value ? opt.color : opt.border}`,background:queueProblemForm.status===opt.value ? opt.bg : "#fff",cursor:"pointer",textAlign:"left",transition:"all .12s"}}>
                            <div style={{fontSize:12,fontWeight:700,color:opt.color}}>{opt.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reschedule date/time pickers */}
                    {queueProblemForm.status === "RESCHEDULED" && (
                      <div style={{marginBottom:16,background:"#eff6ff",border:"1.5px solid #bfdbfe",borderRadius:12,padding:"14px 16px"}}>
                        <div style={{fontSize:11,fontWeight:700,color:"#1d4ed8",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                          <CalendarDays size={13}/>New Procedure Date &amp; Time
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                          <div>
                            <div style={{fontSize:10,fontWeight:600,color:"#475569",marginBottom:4}}>Date</div>
                            <input
                              type="date"
                              min={new Date().toISOString().slice(0,10)}
                              value={queueProblemForm.rescheduleDate}
                              onChange={e=>setQueueProblemForm(f=>({...f,rescheduleDate:e.target.value}))}
                              style={{width:"100%",border:"1.5px solid #bfdbfe",borderRadius:8,padding:"8px 10px",fontSize:12,color:"#1e293b",background:"#fff",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}
                            />
                          </div>
                          <div>
                            <div style={{fontSize:10,fontWeight:600,color:"#475569",marginBottom:4}}>Time</div>
                            <input
                              type="time"
                              value={queueProblemForm.rescheduleTime}
                              onChange={e=>setQueueProblemForm(f=>({...f,rescheduleTime:e.target.value}))}
                              style={{width:"100%",border:"1.5px solid #bfdbfe",borderRadius:8,padding:"8px 10px",fontSize:12,color:"#1e293b",background:"#fff",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}
                            />
                          </div>
                        </div>
                        <div style={{fontSize:10,color:"#3b82f6",marginTop:8}}>A confirmation email will be sent to the patient after rescheduling.</div>
                      </div>
                    )}

                    <div style={{marginBottom:20}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#475569",marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>Notes / Remarks</div>
                      <textarea
                        value={queueProblemForm.remarks}
                        onChange={e=>setQueueProblemForm(f=>({...f,remarks:e.target.value}))}
                        placeholder={queueProblemForm.status==="RESCHEDULED" ? "Optional: additional instructions for the patient..." : "Add any notes, reason for cancellation, etc..."}
                        style={{width:"100%",minHeight:80,border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 12px",fontSize:12,color:"#334155",resize:"vertical",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}
                      />
                    </div>

                    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                      <button onClick={()=>{ setQueueProblemTarget(null); setQueueProblemForm({status:"NO_SHOW",remarks:"",rescheduleDate:"",rescheduleTime:""}); }}
                        style={{padding:"9px 18px",borderRadius:10,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                        Cancel
                      </button>
                      <button onClick={handleQueueProblem} disabled={queueProblemSaving}
                        style={{padding:"9px 20px",borderRadius:10,border:"none",background:queueProblemForm.status==="RESCHEDULED"?"linear-gradient(135deg,#3b82f6,#1d4ed8)":"linear-gradient(135deg,#f97316,#c2410c)",color:"#fff",fontSize:12,fontWeight:700,cursor:queueProblemSaving?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6,opacity:queueProblemSaving?0.7:1}}>
                        {queueProblemSaving
                          ? <><Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/>Saving...</>
                          : queueProblemForm.status==="RESCHEDULED" ? "Reschedule & Send Email" : "Save Status"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Consent Form Upload Modal ── */}
              {consentUploadTarget && (
                <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.55)",backdropFilter:"blur(4px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
                  onClick={()=>{setConsentUploadTarget(null);setConsentFile(null);setConsentUrl("");setConsentUploadMsg("");}}>
                  <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:18,padding:28,width:"100%",maxWidth:480,border:"1px solid #e2e8f0",boxShadow:"0 20px 60px rgba(0,0,0,.15)"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:36,height:36,borderRadius:10,background:"#eff6ff",border:"1.5px solid #bfdbfe",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <FileText size={16} color="#2563eb"/>
                        </div>
                        <div>
                          <div style={{fontSize:14,fontWeight:800,color:"#1e293b"}}>Upload Consent Form</div>
                          <div style={{fontSize:11,color:"#94a3b8"}}>{consentUploadTarget.patient?.name} · {consentUploadTarget.patient?.patientId}</div>
                        </div>
                      </div>
                      <button onClick={()=>{setConsentUploadTarget(null);setConsentFile(null);setConsentUrl("");setConsentUploadMsg("");}}
                        style={{width:30,height:30,borderRadius:8,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={13} color="#94a3b8"/></button>
                    </div>
                    <div style={{fontSize:11,color:"#64748b",marginBottom:20}}>A signed consent form is required before recording a procedure. Accepted formats: PDF, JPG, PNG (max 10 MB).</div>

                    {/* Drop zone */}
                    <label style={{display:"block",border:`2px dashed ${consentUrl?"#16a34a":"#cbd5e1"}`,borderRadius:12,padding:"28px 20px",textAlign:"center",cursor:"pointer",background:consentUrl?"#f0fdf4":"#f8fafc",transition:"all .15s",marginBottom:14}}>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}}
                        onChange={e=>{const f=e.target.files?.[0];if(f){setConsentFile(f);handleConsentUpload(f);}}}/>
                      {consentUploading ? (
                        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,color:"#2563eb"}}>
                          <Loader2 size={18} style={{animation:"spin .7s linear infinite"}}/>Uploading...
                        </div>
                      ) : consentUrl ? (
                        <div>
                          <CheckCircle size={24} color="#16a34a" style={{marginBottom:6}}/>
                          <div style={{fontSize:12,fontWeight:700,color:"#16a34a"}}>{consentFile?.name}</div>
                          <div style={{fontSize:10,color:"#86efac",marginTop:2}}>Click to replace</div>
                        </div>
                      ) : (
                        <div>
                          <FileText size={24} color="#94a3b8" style={{marginBottom:8}}/>
                          <div style={{fontSize:12,fontWeight:600,color:"#475569"}}>Click to upload or drag & drop</div>
                          <div style={{fontSize:10,color:"#94a3b8",marginTop:4}}>PDF, JPG, PNG — max 10 MB</div>
                        </div>
                      )}
                    </label>

                    {consentUploadMsg && (
                      <div style={{fontSize:11,padding:"8px 12px",borderRadius:8,marginBottom:14,background:consentUrl?"#f0fdf4":"#fff5f5",color:consentUrl?"#16a34a":"#ef4444",border:`1px solid ${consentUrl?"#bbf7d0":"#fecaca"}`}}>
                        {consentUploadMsg}
                      </div>
                    )}

                    {consentUrl && (
                      <div style={{marginBottom:14}}>
                        <a href={consentUrl} target="_blank" rel="noreferrer"
                          style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:11,color:"#2563eb",textDecoration:"underline"}}>
                          <Eye size={12}/>Preview uploaded file
                        </a>
                      </div>
                    )}

                    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                      <button onClick={()=>{setConsentUploadTarget(null);setConsentFile(null);setConsentUrl("");setConsentUploadMsg("");}}
                        style={{padding:"9px 16px",borderRadius:10,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                        Cancel
                      </button>
                      {!consentUrl && (
                        <button onClick={proceedAfterConsent}
                          style={{padding:"9px 16px",borderRadius:10,border:"1px solid #fed7aa",background:"#fff7ed",color:"#c2410c",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                          Skip &amp; Proceed
                        </button>
                      )}
                      <button onClick={proceedAfterConsent} disabled={!consentUrl && !consentFile}
                        style={{padding:"9px 20px",borderRadius:10,border:"none",background:consentUrl?"linear-gradient(135deg,#22c55e,#16a34a)":"linear-gradient(135deg,#64748b,#475569)",color:"#fff",fontSize:12,fontWeight:700,cursor:consentUrl?"pointer":"not-allowed",display:"flex",alignItems:"center",gap:6}}>
                        <CheckCircle size={13}/>Proceed to Record
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── View Completed Modal ── */}
              {viewCompletedItem && (
                <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
                  onClick={()=>setViewCompletedItem(null)}>
                  <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:16,padding:28,width:"100%",maxWidth:540,border:"1px solid #e2e8f0",maxHeight:"90vh",overflowY:"auto"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                      <div style={{fontSize:16,fontWeight:800,color:"#1e293b"}}>Completed Procedure Details</div>
                      <button onClick={()=>setViewCompletedItem(null)} style={{width:32,height:32,borderRadius:9,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={14} color="#94a3b8"/></button>
                    </div>
                    {/* Patient Info */}
                    <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:"#f8fafc",borderRadius:12,border:"1px solid #e2e8f0",marginBottom:16}}>
                      <div style={{width:40,height:40,borderRadius:10,background:"linear-gradient(135deg,#22c55e,#16a34a)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:"#fff"}}>
                        {(viewCompletedItem.patient?.name||"P").charAt(0).toUpperCase()}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#1e293b"}}>{viewCompletedItem.patient?.name||"—"}</div>
                        <div style={{fontSize:11,color:"#94a3b8"}}>{viewCompletedItem.patient?.patientId||""}{viewCompletedItem.patient?.phone?` · ${viewCompletedItem.patient.phone}`:""}{viewCompletedItem.patient?.gender?` · ${viewCompletedItem.patient.gender}`:""}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:10,color:"#94a3b8",fontWeight:600}}>TOKEN</div>
                        <div style={{fontSize:17,fontWeight:800,color:meta.accent}}>{viewCompletedItem.tokenNumber||"—"}</div>
                      </div>
                    </div>
                    {/* Info grid */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                      {[
                        ["Referred By", viewCompletedItem.doctor?.name || "—"],
                        ["Specialization", viewCompletedItem.doctor?.specialization || "—"],
                        ["Appointment Date", viewCompletedItem.appointmentDate ? new Date(viewCompletedItem.appointmentDate).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—"],
                        ["Time Slot", viewCompletedItem.timeSlot || "—"],
                        ["Type", viewCompletedItem.type || "—"],
                        ["Consultation Fee", viewCompletedItem.consultationFee ? `₹${viewCompletedItem.consultationFee}` : "—"],
                      ].map(([k,v])=>(
                        <div key={k} style={{background:"#f8fafc",borderRadius:9,padding:"10px 12px",border:"1px solid #f1f5f9"}}>
                          <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:".04em"}}>{k}</div>
                          <div style={{fontSize:12,fontWeight:600,color:"#334155",marginTop:2}}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {/* Referral Note */}
                    {viewCompletedItem.subDeptNote && (
                      <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:12,marginBottom:16}}>
                        <div style={{fontSize:10,fontWeight:700,color:"#16a34a",marginBottom:4,display:"flex",alignItems:"center",gap:5}}><MessageSquare size={11}/>Referral Note</div>
                        <div style={{fontSize:12,color:"#166534",lineHeight:1.5}}>{viewCompletedItem.subDeptNote}</div>
                      </div>
                    )}
                    {/* Procedure Records */}
                    <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".04em",marginBottom:8}}>Procedures Performed</div>
                    {viewCompletedItem.procedureRecords?.map((pr:any,i:number)=>(
                      <div key={i} style={{background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0",padding:"12px 14px",marginBottom:8}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                          <span style={{fontSize:12,fontWeight:700,color:"#1e293b"}}>{pr.procedureName||"—"}</span>
                          <span style={{fontSize:10,padding:"2px 8px",borderRadius:100,background:(PROC_TYPE_COLOR[pr.procedureType]||"#94a3b8")+"18",color:PROC_TYPE_COLOR[pr.procedureType]||"#94a3b8",fontWeight:700}}>{pr.procedureType}</span>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                          {[["Amount",`₹${pr.amount||0}`],["Status",pr.status||"—"],["Performed By",pr.performedBy||"—"]].map(([k,v])=>(
                            <div key={k}><div style={{fontSize:10,color:"#94a3b8",fontWeight:600}}>{k}</div><div style={{fontSize:11,fontWeight:600,color:"#334155"}}>{v}</div></div>
                          ))}
                        </div>
                        {pr.performedAt && <div style={{fontSize:10,color:"#94a3b8",marginTop:4}}>Performed: {new Date(pr.performedAt).toLocaleString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</div>}
                        {pr.notes && <div style={{fontSize:11,color:"#64748b",marginTop:4,fontStyle:"italic"}}>{pr.notes}</div>}
                      </div>
                    ))}
                    <div style={{display:"flex",justifyContent:"flex-end",marginTop:14}}>
                      <button onClick={()=>setViewCompletedItem(null)} style={{padding:"9px 20px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>Close</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Edit Completed Modal ── */}
              {editCompletedItem && (
                <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
                  onClick={()=>{if(!editCompletedSaving)setEditCompletedItem(null);}}>
                  <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:16,padding:28,width:"100%",maxWidth:480,border:"1px solid #e2e8f0"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                      <div>
                        <div style={{fontSize:16,fontWeight:800,color:"#1e293b"}}>Edit Procedure Record</div>
                        <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>For {editCompletedItem.patient?.name||"—"} — {editCompletedItem.procedureRecords?.[0]?.procedureName||""}</div>
                      </div>
                      <button onClick={()=>setEditCompletedItem(null)} disabled={editCompletedSaving} style={{width:32,height:32,borderRadius:9,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={14} color="#94a3b8"/></button>
                    </div>
                    <div style={{display:"grid",gap:14}}>
                      <div>
                        <label style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Amount (₹)</label>
                        <input type="number" value={editCompletedForm.amount} onChange={e=>setEditCompletedForm((f:any)=>({...f,amount:e.target.value}))}
                          style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:12,color:"#334155",outline:"none",fontFamily:"inherit"}}/>
                      </div>
                      <div>
                        <label style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Performed By</label>
                        <input value={editCompletedForm.performedBy} onChange={e=>setEditCompletedForm((f:any)=>({...f,performedBy:e.target.value}))}
                          placeholder="Doctor / technician name" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:12,color:"#334155",outline:"none",fontFamily:"inherit"}}/>
                      </div>
                      <div>
                        <label style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Status</label>
                        <select value={editCompletedForm.status} onChange={e=>setEditCompletedForm((f:any)=>({...f,status:e.target.value}))}
                          style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:12,color:"#334155",outline:"none",fontFamily:"inherit"}}>
                          {["COMPLETED","PENDING","CANCELLED"].map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Notes</label>
                        <textarea value={editCompletedForm.notes} onChange={e=>setEditCompletedForm((f:any)=>({...f,notes:e.target.value}))}
                          rows={3} placeholder="Optional notes" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:12,color:"#334155",outline:"none",fontFamily:"inherit",resize:"vertical"}}/>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:10,marginTop:18,borderTop:"1px solid #f1f5f9",paddingTop:18}}>
                      <button onClick={saveEditCompleted} disabled={editCompletedSaving}
                        style={{padding:"10px 24px",borderRadius:10,border:"none",background:meta.gradient,color:"#fff",fontSize:12,fontWeight:700,cursor:editCompletedSaving?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6,opacity:editCompletedSaving?.7:1}}>
                        {editCompletedSaving ? <Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/> : <Save size={13}/>}
                        {editCompletedSaving?"Saving...":"Save Changes"}
                      </button>
                      <button onClick={()=>setEditCompletedItem(null)} disabled={editCompletedSaving}
                        style={{padding:"10px 18px",borderRadius:10,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Ban size={13}/>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Delete Completed Confirmation Modal ── */}
              {deleteCompletedTarget && (
                <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
                  onClick={e=>{if(e.target===e.currentTarget && !deletingCompleted) setDeleteCompletedTarget(null);}}>
                  <div style={{background:"#fff",borderRadius:16,padding:24,width:"100%",maxWidth:440,border:"1px solid #e2e8f0"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:18}}>
                      <div style={{width:40,height:40,borderRadius:10,background:"#fff5f5",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <AlertTriangle size={20} color="#ef4444"/>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:15,fontWeight:700,color:"#1e293b",marginBottom:4}}>Delete Procedure Record?</div>
                        <div style={{fontSize:12,color:"#64748b",lineHeight:1.5}}>
                          Are you sure you want to delete the procedure record for <strong>{deleteCompletedTarget.patient?.name||"—"}</strong>?
                          {deleteCompletedTarget.procedureRecords?.[0]?.procedureName && <> ({deleteCompletedTarget.procedureRecords[0].procedureName})</>}
                        </div>
                      </div>
                    </div>
                    {deleteCompletedTarget.procedureRecords?.[0]?.amount > 0 && (
                      <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:12,marginBottom:18}}>
                        <div style={{fontSize:11,color:"#92400e",fontWeight:600,marginBottom:4}}>⚠️ Warning</div>
                        <div style={{fontSize:10,color:"#a16207"}}>This will permanently remove the ₹{deleteCompletedTarget.procedureRecords[0].amount} procedure record and the patient will reappear in the pending queue.</div>
                      </div>
                    )}
                    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                      <button onClick={()=>setDeleteCompletedTarget(null)} disabled={deletingCompleted}
                        style={{padding:"9px 18px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:deletingCompleted?"not-allowed":"pointer",opacity:deletingCompleted?.5:1}}>Cancel</button>
                      <button onClick={handleDeleteCompleted} disabled={deletingCompleted}
                        style={{padding:"9px 18px",borderRadius:9,border:"none",background:"#ef4444",color:"#fff",fontSize:12,fontWeight:700,cursor:deletingCompleted?"not-allowed":"pointer",opacity:deletingCompleted?.7:1,display:"flex",alignItems:"center",gap:6}}>
                        {deletingCompleted && <Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/>}
                        {deletingCompleted?"Deleting...":"Delete Record"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>)}

            {/* ═══════════════════ BILLING & RECEPTION REPORTS ═══════════════════ */}
            {tab==="reports" && (deptType==="BILLING" || deptType==="RECEPTION") && (<div style={{padding:24,background:"#fff",minHeight:"100%",boxSizing:"border-box"}}>
              {(deptType==="BILLING" ? (billingReportLoading || !billingReportData) : (reportLoading || !reportData)) ? (
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"80px 0",color:"#94a3b8"}}>
                  <Loader2 size={22} style={{animation:"spin .7s linear infinite"}}/>Loading {deptType==="RECEPTION"?"reception":"billing"} reports...
                </div>
              ) : (()=>{
                const isRec = deptType === "RECEPTION";
                const data  = isRec ? reportData : billingReportData;
                const stats = isRec ? (data.summary || {}) : (data.stats || {});
                const fmtC = (v:number) => `₹${Number(v||0).toLocaleString("en-IN",{minimumFractionDigits:0})}`;
                
                // Define KPI Cards based on dept
                const kpiCards = isRec ? [
                  {icon:<CalendarDays size={20} color="#2563eb"/>,bg:"#eff6ff",value:String(stats.todayAppointments||0),label:"Today's Appointments",badge:"TODAY",badgeBg:"#eff6ff",badgeColor:"#2563eb",badgeBorder:"#bfdbfe"},
                  {icon:<Users size={20} color="#16a34a"/>,bg:"#f0fdf4",value:String(stats.todayPatients||0),label:"New Patients (Today)",badge:null as null,badgeBg:"",badgeColor:"",badgeBorder:""},
                  {icon:<ClipboardList size={20} color="#9333ea"/>,bg:"#faf5ff",value:String(stats.totalAppointments||0),label:"Total Appointments",badge:null as null,badgeBg:"",badgeColor:"",badgeBorder:""},
                  {icon:<UserPlus size={20} color="#ea580c"/>,bg:"#fff7ed",value:String(stats.totalPatients||0),label:"Total Patients Registered",badge:null as null,badgeBg:"",badgeColor:"",badgeBorder:""},
                ] : [
                  {icon:<IndianRupee size={20} color="#16a34a"/>,bg:"#f0fdf4",value:fmtC(stats.todayRevenue),label:"Today's Revenue",badge:"TODAY",badgeBg:"#f0fdf4",badgeColor:"#16a34a",badgeBorder:"#bbf7d0"},
                  {icon:<FileText size={20} color="#2563eb"/>,bg:"#eff6ff",value:String(stats.totalBills),label:"Total Bills",badge:null as null,badgeBg:"",badgeColor:"",badgeBorder:""},
                  {icon:<Clock size={20} color={stats.pendingCount>0?"#ea580c":"#94a3b8"}/>,bg:stats.pendingCount>0?"#fff3e6":"#f8fafc",value:String(stats.pendingCount),label:"Pending Bills",badge:stats.pendingCount>0?"PENDING":null as null,badgeBg:"#fff3e6",badgeColor:"#ea580c",badgeBorder:"#fed7aa"},
                  {icon:<TrendingUp size={20} color={meta.accent}/>,bg:meta.lightBg,value:fmtC(stats.monthRevenue),label:"Monthly Revenue",badge:null as null,badgeBg:"",badgeColor:"",badgeBorder:""},
                ];

                const secondaryChips = isRec ? [
                  {icon:<Activity size={16} color="#3b82f6"/>,value:String(stats.avgApptsPerDay||0),label:"Avg Appointments/Day",bg:"#eff6ff"},
                  {icon:<CheckCircle2 size={16} color="#16a34a"/>,value:String((data.byStatus||[]).find((s:any)=>s.name==="COMPLETED")?.value || 0),label:"Completed Appts",bg:"#f0fdf4"},
                  {icon:<Clock size={16} color="#f59e0b"/>,value:String((data.byStatus||[]).find((s:any)=>s.name==="BOOKED"||s.name==="ARRIVED")?.value || 0),label:"Waiting/Scheduled",bg:"#fffbeb"},
                  {icon:<AlertCircle size={16} color="#ef4444"/>,value:String((data.byStatus||[]).find((s:any)=>s.name==="CANCELLED")?.value || 0),label:"Cancelled Appts",bg:"#fef2f2"},
                ] : [
                  {icon:<CheckCircle2 size={16} color="#16a34a"/>,value:String(stats.paidCount),label:"Paid Bills",bg:"#f0fdf4"},
                  {icon:<AlertCircle size={16} color="#ea580c"/>,value:fmtC(stats.pendingAmount),label:"Pending Amount",bg:"#fff7ed"},
                  {icon:<Activity size={16} color="#9333ea"/>,value:`${stats.collectionRate}%`,label:"Collection Rate",bg:"#faf5ff"},
                  {icon:<TrendingUp size={16} color={meta.accent}/>,value:fmtC(stats.monthRevenue),label:"Month Collection",bg:meta.lightBg},
                ];

                return (<>
                  {/* Header */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                    <div>
                      <div style={{fontSize:22,fontWeight:800,color:"#0f172a",letterSpacing:"-.02em"}}>{isRec?"Reception":"Billing"} Reports & Analytics</div>
                      <div style={{fontSize:12,color:"#64748b",marginTop:3,display:"flex",alignItems:"center",gap:6}}>
                        <span style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",display:"inline-block",boxShadow:"0 0 0 3px #dcfce7",flexShrink:0}}/>
                        Live &middot; {deptName}
                      </div>
                    </div>
                    <button onClick={isRec ? loadReports : loadBillingReports} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:10,border:"1px solid #e2e8f0",background:"#fff",fontSize:12,fontWeight:600,color:"#475569",cursor:"pointer"}}>
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
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"20px 20px 14px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:4}}>{isRec?"Daily Appointments & Registrations":"Daily Revenue & Bills"} (Last 30 Days)</div>
                      <div style={{fontSize:10,color:"#94a3b8",marginBottom:14}}>Hover for details</div>
                      <div style={{width:"100%",height:260}}>
                        <RechartsResponsiveContainer width="100%" height="100%">
                          <RechartsAreaChart data={data.dailyTrend||[]} margin={{top:5,right:10,left:-10,bottom:0}}>
                            <defs>
                              <linearGradient id="chartGrad1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={isRec?"#3b82f6":"#10b981"} stopOpacity={.3}/><stop offset="100%" stopColor={isRec?"#3b82f6":"#10b981"} stopOpacity={0}/></linearGradient>
                              <linearGradient id="chartGrad2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={isRec?"#ea580c":meta.accent} stopOpacity={.25}/><stop offset="100%" stopColor={isRec?"#ea580c":meta.accent} stopOpacity={0}/></linearGradient>
                            </defs>
                            <RechartsXAxis dataKey="label" tick={{fontSize:10,fill:"#94a3b8"}} tickLine={false} axisLine={{stroke:"#f1f5f9"}} interval={isRec?4:0}/>
                            <RechartsYAxis yAxisId="left" tick={{fontSize:10,fill:"#94a3b8"}} tickLine={false} axisLine={false}/>
                            <RechartsYAxis yAxisId="right" orientation="right" tick={{fontSize:10,fill:"#94a3b8"}} tickLine={false} axisLine={false}/>
                            <RechartsTooltip contentStyle={{borderRadius:10,border:"1px solid #e2e8f0",fontSize:11,boxShadow:"0 4px 12px rgba(0,0,0,.08)"}} formatter={isRec ? undefined : (val:any,name:any)=>[name==="Revenue (₹)"?`₹${Number(val).toLocaleString("en-IN")}`:val,name]}/>
                            <RechartsArea yAxisId="left" type="monotone" dataKey="count" stroke={isRec?"#3b82f6":"#10b981"} fill="url(#chartGrad1)" strokeWidth={2.5} name={isRec?"Appointments":"Revenue (₹)"} dot={isRec?false:{r:4,fill:isRec?"#3b82f6":"#10b981",strokeWidth:2,stroke:"#fff"}} activeDot={{r:6}}/>
                            <RechartsArea yAxisId="right" type="monotone" dataKey={isRec?"patients":"count"} stroke={isRec?"#ea580c":meta.accent} fill="url(#chartGrad2)" strokeWidth={2.5} name={isRec?"New Patients":"Bills"} dot={isRec?false:{r:4,fill:isRec?"#ea580c":meta.accent,strokeWidth:2,stroke:"#fff"}} activeDot={{r:6}}/>
                          </RechartsAreaChart>
                        </RechartsResponsiveContainer>
                      </div>
                      <div style={{display:"flex",gap:16,marginTop:10}}>
                        {[{color:isRec?"#3b82f6":"#10b981",label:isRec?"Appointments":"Revenue"},{color:isRec?"#ea580c":meta.accent,label:isRec?"Patients":"Bill Count"}].map((l,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"#64748b",fontWeight:600}}>
                            <span style={{width:10,height:3,borderRadius:2,background:l.color,display:"inline-block"}}/>{l.label}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,.04)",display:"flex",flexDirection:"column"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:4}}>{isRec?"Appointment Status Distribution":"Bill Status Distribution"}</div>
                      <div style={{fontSize:10,color:"#94a3b8",marginBottom:14}}>All time &middot; Total: {isRec?stats.totalAppointments:stats.totalBills}</div>
                      <div style={{flex:1,width:"100%"}}>
                        <RechartsResponsiveContainer width="100%" height={220}>
                          <RechartsPieChart>
                            <RechartsPie data={data.byStatus||[]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88} paddingAngle={3} strokeWidth={0}>
                              {(data.byStatus||[]).map((_:any,i:number)=>(
                                <RechartsCell key={i} fill={(data.byStatus||[])[i]?.fill||"#94a3b8"}/>
                              ))}
                            </RechartsPie>
                            <RechartsTooltip contentStyle={{borderRadius:8,border:"1px solid #e2e8f0",fontSize:11}}/>
                          </RechartsPieChart>
                        </RechartsResponsiveContainer>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 12px",marginTop:10}}>
                        {(data.byStatus||[]).map((s:any,i:number)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:"#64748b",fontWeight:600}}>
                            <span style={{width:8,height:8,borderRadius:2,background:s.fill,flexShrink:0}}/>{s.name}: {s.value}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>);
              })()}
            </div>)}

            {/* ═══════════════════ REPORTS (non-billing depts) ═══════════════════ */}
            {tab==="reports" && deptType!=="BILLING" && deptType!=="RECEPTION" && (<div style={{padding:24,background:"#fff",minHeight:"100%",boxSizing:"border-box"}}>
              {reportLoading || !reportData ? (
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"80px 0",color:"#94a3b8"}}>
                  <Loader2 size={22} style={{animation:"spin .7s linear infinite"}}/>Loading reports...
                </div>
              ) : (()=>{
                const s = reportData.summary || {};
                const CHART_COLORS = [meta.accent,"#6366f1","#f59e0b","#ef4444","#10b981","#ec4899","#8b5cf6","#06b6d4"];
                const TYPE_COLORS: Record<string,string> = {DIAGNOSTIC:"#6366f1",THERAPEUTIC:"#10b981",SURGICAL:"#ef4444",COSMETIC:"#ec4899",PREVENTIVE:"#f59e0b",EMERGENCY:"#dc2626",REHABILITATIVE:"#06b6d4",OTHER:"#94a3b8"};
                const GENDER_COLORS: Record<string,string> = {MALE:"#3b82f6",FEMALE:"#ec4899",OTHER:"#8b5cf6",Unknown:"#94a3b8"};

                return (<>
                  {/* Header + Refresh */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                    <div>
                      <div style={{fontSize:17,fontWeight:800,color:"#1e293b",display:"flex",alignItems:"center",gap:8}}><BarChart2 size={20} color={meta.accent}/>{deptName} — Reports & Analytics</div>
                      <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>Comprehensive overview of all procedures, revenue, and performance metrics</div>
                    </div>
                    <button onClick={loadReports} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:10,border:"none",background:meta.gradient,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                      <RefreshCw size={14}/>Refresh
                    </button>
                  </div>

                  {/* Summary Cards */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
                    {[
                      {label:"Total Procedures Done",value:s.totalRecords,icon:<ClipboardList size={18}/>,color:meta.accent,bg:meta.lightBg,border:meta.borderColor},
                      {label:"Total Revenue",value:`₹${(s.totalRevenue||0).toLocaleString("en-IN")}`,icon:<IndianRupee size={18}/>,color:"#10b981",bg:"#f0fdf4",border:"#bbf7d0"},
                      {label:"Today's Procedures",value:s.todayRecords,icon:<Activity size={18}/>,color:"#6366f1",bg:"#eef2ff",border:"#c7d2fe"},
                      {label:"Today's Revenue",value:`₹${(s.todayRevenue||0).toLocaleString("en-IN")}`,icon:<TrendingUp size={18}/>,color:"#f59e0b",bg:"#fffbeb",border:"#fde68a"},
                    ].map((c,i)=>(
                      <div key={i} style={{background:"#fff",borderRadius:14,padding:"18px 20px",border:`1px solid ${c.border}`,boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                          <div style={{width:38,height:38,borderRadius:10,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",color:c.color}}>{c.icon}</div>
                        </div>
                        <div style={{fontSize:22,fontWeight:800,color:c.color}}>{c.value}</div>
                        <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,marginTop:2}}>{c.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Secondary Stats Row */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
                    {[
                      {label:"Active Procedures",value:s.activeProcedures,color:meta.accent},
                      {label:"Total Catalog",value:s.totalProcedures,color:"#6366f1"},
                      {label:"Total Referrals",value:s.totalReferred,color:"#10b981"},
                      {label:"Avg Revenue / Record",value:`₹${(s.avgRevenuePerRecord||0).toLocaleString("en-IN")}`,color:"#f59e0b"},
                    ].map((c,i)=>(
                      <div key={i} style={{background:"#fff",borderRadius:12,padding:"14px 18px",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",gap:12}}>
                        <div style={{width:8,height:32,borderRadius:4,background:c.color,flexShrink:0}}/>
                        <div>
                          <div style={{fontSize:17,fontWeight:800,color:"#1e293b"}}>{c.value}</div>
                          <div style={{fontSize:10,color:"#94a3b8",fontWeight:600}}>{c.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Charts Row 1: Daily Trend + Procedures by Type */}
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:18,marginBottom:24}}>
                    {/* Daily Trend Line Chart */}
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"20px 20px 14px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:4}}>Daily Procedures & Revenue (Last 30 Days)</div>
                      <div style={{fontSize:10,color:"#94a3b8",marginBottom:14}}>Hover for details</div>
                      <div style={{width:"100%",height:260}}>
                        <RechartsResponsiveContainer width="100%" height="100%">
                          <RechartsAreaChart data={reportData.dailyTrend||[]} margin={{top:5,right:10,left:-10,bottom:0}}>
                            <defs>
                              <linearGradient id="gradCount" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={meta.accent} stopOpacity={.3}/><stop offset="100%" stopColor={meta.accent} stopOpacity={0}/></linearGradient>
                              <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={.25}/><stop offset="100%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                            </defs>
                            <RechartsXAxis dataKey="label" tick={{fontSize:10,fill:"#94a3b8"}} tickLine={false} axisLine={{stroke:"#f1f5f9"}} interval={4}/>
                            <RechartsYAxis yAxisId="left" tick={{fontSize:10,fill:"#94a3b8"}} tickLine={false} axisLine={false}/>
                            <RechartsYAxis yAxisId="right" orientation="right" tick={{fontSize:10,fill:"#94a3b8"}} tickLine={false} axisLine={false}/>
                            <RechartsTooltip contentStyle={{borderRadius:10,border:"1px solid #e2e8f0",fontSize:11,boxShadow:"0 4px 12px rgba(0,0,0,.08)"}}/>
                            <RechartsArea yAxisId="left" type="monotone" dataKey="count" stroke={meta.accent} fill="url(#gradCount)" strokeWidth={2} name="Procedures" dot={false}/>
                            <RechartsArea yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#gradRev)" strokeWidth={2} name="Revenue (₹)" dot={false}/>
                          </RechartsAreaChart>
                        </RechartsResponsiveContainer>
                      </div>
                    </div>

                    {/* Procedures by Type — Pie */}
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:14}}>By Procedure Type</div>
                      <div style={{width:"100%",height:180}}>
                        <RechartsResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <RechartsPie data={(reportData.byType||[]).map((t:any,i:number)=>({...t,fill:TYPE_COLORS[t.type]||CHART_COLORS[i%CHART_COLORS.length]}))} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} strokeWidth={0}>
                              {(reportData.byType||[]).map((_:any,i:number)=>(
                                <RechartsCell key={i} fill={TYPE_COLORS[(reportData.byType||[])[i]?.type]||CHART_COLORS[i%CHART_COLORS.length]}/>
                              ))}
                            </RechartsPie>
                            <RechartsTooltip contentStyle={{borderRadius:8,border:"1px solid #e2e8f0",fontSize:10}}/>
                          </RechartsPieChart>
                        </RechartsResponsiveContainer>
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:6}}>
                        {(reportData.byType||[]).map((t:any,i:number)=>(
                          <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:600,color:"#64748b"}}>
                            <span style={{width:8,height:8,borderRadius:2,background:TYPE_COLORS[t.type]||CHART_COLORS[i%CHART_COLORS.length],flexShrink:0}}/>
                            {t.type} ({t.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Charts Row 2: Monthly Revenue Bar + Status Distribution */}
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:18,marginBottom:24}}>
                    {/* Monthly Revenue Bar Chart */}
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"20px 20px 14px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:4}}>Monthly Revenue & Procedures (Last 6 Months)</div>
                      <div style={{fontSize:10,color:"#94a3b8",marginBottom:14}}>Bar = Revenue, Line = Count</div>
                      <div style={{width:"100%",height:240}}>
                        <RechartsResponsiveContainer width="100%" height="100%">
                          <RechartsComposedChart data={reportData.monthlyTrend||[]} margin={{top:5,right:10,left:-10,bottom:0}}>
                            <RechartsXAxis dataKey="label" tick={{fontSize:10,fill:"#64748b"}} tickLine={false} axisLine={{stroke:"#f1f5f9"}}/>
                            <RechartsYAxis yAxisId="left" tick={{fontSize:10,fill:"#94a3b8"}} tickLine={false} axisLine={false}/>
                            <RechartsYAxis yAxisId="right" orientation="right" tick={{fontSize:10,fill:"#94a3b8"}} tickLine={false} axisLine={false}/>
                            <RechartsTooltip contentStyle={{borderRadius:10,border:"1px solid #e2e8f0",fontSize:11,boxShadow:"0 4px 12px rgba(0,0,0,.08)"}}/>
                            <RechartsBar yAxisId="left" dataKey="revenue" fill={meta.accent} radius={[6,6,0,0]} name="Revenue (₹)" opacity={0.85} barSize={32}/>
                            <RechartsLine yAxisId="right" type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2.5} dot={{r:4,fill:"#f59e0b"}} name="Procedures"/>
                          </RechartsComposedChart>
                        </RechartsResponsiveContainer>
                      </div>
                    </div>

                    {/* Status Distribution */}
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:14}}>Record Status</div>
                      {(reportData.byStatus||[]).map((st:any,i:number)=>{
                        const total = (reportData.byStatus||[]).reduce((s:number,x:any)=>s+x.count,0);
                        const pct = total ? Math.round((st.count/total)*100) : 0;
                        const statusColors: Record<string,string> = {COMPLETED:"#10b981",PENDING:"#f59e0b",CANCELLED:"#ef4444",IN_PROGRESS:"#6366f1"};
                        const clr = statusColors[st.status]||"#94a3b8";
                        return (
                          <div key={i} style={{marginBottom:14}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                              <span style={{fontSize:11,fontWeight:600,color:"#334155"}}>{st.status}</span>
                              <span style={{fontSize:11,fontWeight:700,color:clr}}>{st.count} ({pct}%)</span>
                            </div>
                            <div style={{height:8,borderRadius:4,background:"#f1f5f9",overflow:"hidden"}}>
                              <div style={{height:"100%",borderRadius:4,background:clr,width:`${pct}%`,transition:"width .5s ease"}}/>
                            </div>
                          </div>
                        );
                      })}
                      {(reportData.byStatus||[]).length===0 && <div style={{color:"#94a3b8",fontSize:11}}>No data</div>}
                    </div>
                  </div>

                  {/* Tables Row: Top Procedures + Performers */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:24}}>
                    {/* Top Procedures Table */}
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                      <div style={{padding:"16px 18px",borderBottom:"1px solid #f1f5f9",fontSize:13,fontWeight:700,color:"#1e293b",display:"flex",alignItems:"center",gap:8}}><ClipboardList size={15} color={meta.accent}/>Top Procedures</div>
                      <table style={{width:"100%",borderCollapse:"collapse"}}>
                        <thead>
                          <tr style={{background:"#f8fafc"}}>
                            {["#","Procedure","Type","Count","Revenue"].map(h=>(
                              <th key={h} style={{textAlign:"left",fontSize:10,fontWeight:600,color:"#94a3b8",padding:"10px 14px",borderBottom:"2px solid #f1f5f9"}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(reportData.topProcedures||[]).map((p:any,i:number)=>(
                            <tr key={i} style={{borderBottom:"1px solid #f8fafc"}} onMouseEnter={e=>e.currentTarget.style.background="#fafbfc"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                              <td style={{padding:"10px 14px",fontSize:11,fontWeight:700,color:meta.accent}}>{i+1}</td>
                              <td style={{padding:"10px 14px",fontSize:12,fontWeight:600,color:"#1e293b"}}>{p.name}</td>
                              <td style={{padding:"10px 14px"}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:100,fontWeight:700,background:(TYPE_COLORS[p.type]||"#94a3b8")+"18",color:TYPE_COLORS[p.type]||"#94a3b8"}}>{p.type}</span></td>
                              <td style={{padding:"10px 14px",fontSize:12,fontWeight:700,color:"#334155"}}>{p.count}</td>
                              <td style={{padding:"10px 14px",fontSize:12,fontWeight:700,color:"#10b981"}}>₹{(p.revenue||0).toLocaleString("en-IN")}</td>
                            </tr>
                          ))}
                          {(reportData.topProcedures||[]).length===0 && <tr><td colSpan={5} style={{padding:20,textAlign:"center",color:"#94a3b8",fontSize:11}}>No data</td></tr>}
                        </tbody>
                      </table>
                    </div>

                    {/* Performers Leaderboard */}
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                      <div style={{padding:"16px 18px",borderBottom:"1px solid #f1f5f9",fontSize:13,fontWeight:700,color:"#1e293b",display:"flex",alignItems:"center",gap:8}}><Users size={15} color="#6366f1"/>Performers Leaderboard</div>
                      <table style={{width:"100%",borderCollapse:"collapse"}}>
                        <thead>
                          <tr style={{background:"#f8fafc"}}>
                            {["#","Name","Procedures","Revenue"].map(h=>(
                              <th key={h} style={{textAlign:"left",fontSize:10,fontWeight:600,color:"#94a3b8",padding:"10px 14px",borderBottom:"2px solid #f1f5f9"}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(reportData.performers||[]).map((p:any,i:number)=>(
                            <tr key={i} style={{borderBottom:"1px solid #f8fafc"}} onMouseEnter={e=>e.currentTarget.style.background="#fafbfc"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                              <td style={{padding:"10px 14px"}}>
                                <div style={{width:26,height:26,borderRadius:7,background:i===0?"linear-gradient(135deg,#f59e0b,#eab308)":i===1?"linear-gradient(135deg,#94a3b8,#64748b)":i===2?"linear-gradient(135deg,#cd7f32,#b8860b)":"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:i<3?"#fff":"#64748b"}}>{i+1}</div>
                              </td>
                              <td style={{padding:"10px 14px"}}>
                                <div style={{display:"flex",alignItems:"center",gap:8}}>
                                  <div style={{width:28,height:28,borderRadius:8,background:meta.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff"}}>{(p.name||"?").charAt(0).toUpperCase()}</div>
                                  <span style={{fontSize:12,fontWeight:600,color:"#1e293b"}}>{p.name}</span>
                                </div>
                              </td>
                              <td style={{padding:"10px 14px",fontSize:12,fontWeight:700,color:"#334155"}}>{p.count}</td>
                              <td style={{padding:"10px 14px",fontSize:12,fontWeight:700,color:"#10b981"}}>₹{(p.revenue||0).toLocaleString("en-IN")}</td>
                            </tr>
                          ))}
                          {(reportData.performers||[]).length===0 && <tr><td colSpan={4} style={{padding:20,textAlign:"center",color:"#94a3b8",fontSize:11}}>No data</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Charts Row 3: Peak Hours + Patient Demographics */}
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:18,marginBottom:24}}>
                    {/* Peak Hours Bar */}
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"20px 20px 14px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:4}}>Peak Hours Distribution</div>
                      <div style={{fontSize:10,color:"#94a3b8",marginBottom:14}}>When procedures are performed most</div>
                      <div style={{width:"100%",height:200}}>
                        <RechartsResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart data={reportData.hourlyDistribution||[]} margin={{top:5,right:10,left:-10,bottom:0}}>
                            <RechartsXAxis dataKey="hour" tick={{fontSize:10,fill:"#94a3b8"}} tickLine={false} axisLine={{stroke:"#f1f5f9"}}/>
                            <RechartsYAxis tick={{fontSize:10,fill:"#94a3b8"}} tickLine={false} axisLine={false}/>
                            <RechartsTooltip contentStyle={{borderRadius:8,border:"1px solid #e2e8f0",fontSize:10}}/>
                            <RechartsBar dataKey="count" fill={meta.accent} radius={[4,4,0,0]} name="Procedures" opacity={0.85} barSize={24}/>
                          </RechartsBarChart>
                        </RechartsResponsiveContainer>
                      </div>
                    </div>

                    {/* Patient Demographics Pie */}
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:14}}>Patient Demographics</div>
                      <div style={{width:"100%",height:160}}>
                        <RechartsResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <RechartsPie data={reportData.genderDistribution||[]} dataKey="count" nameKey="gender" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} strokeWidth={0}>
                              {(reportData.genderDistribution||[]).map((_:any,i:number)=>(
                                <RechartsCell key={i} fill={GENDER_COLORS[(reportData.genderDistribution||[])[i]?.gender]||CHART_COLORS[i%CHART_COLORS.length]}/>
                              ))}
                            </RechartsPie>
                            <RechartsTooltip contentStyle={{borderRadius:8,border:"1px solid #e2e8f0",fontSize:10}}/>
                          </RechartsPieChart>
                        </RechartsResponsiveContainer>
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:6,justifyContent:"center"}}>
                        {(reportData.genderDistribution||[]).map((g:any,i:number)=>(
                          <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:600,color:"#64748b"}}>
                            <span style={{width:8,height:8,borderRadius:2,background:GENDER_COLORS[g.gender]||CHART_COLORS[i%CHART_COLORS.length],flexShrink:0}}/>
                            {g.gender} ({g.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent Records Table — searchable + sortable */}
                  {(()=>{
                    const allRecent = reportData.recentRecords||[];
                    const filtered = allRecent.filter((r:any)=>{
                      if(!recentSearch) return true;
                      const q = recentSearch.toLowerCase();
                      return (r.patientName||"").toLowerCase().includes(q)
                        || (r.patientId||"").toLowerCase().includes(q)
                        || (r.procedureName||"").toLowerCase().includes(q)
                        || (r.procedureType||"").toLowerCase().includes(q)
                        || (r.performedBy||"").toLowerCase().includes(q);
                    });
                    const sorted = [...filtered].sort((a:any,b:any)=>{
                      const d = recentSortDir==="asc"?1:-1;
                      if(recentSortField==="patient") return d*((a.patientName||"").localeCompare(b.patientName||""));
                      if(recentSortField==="patientId") return d*((a.patientId||"").localeCompare(b.patientId||""));
                      if(recentSortField==="procedure") return d*((a.procedureName||"").localeCompare(b.procedureName||""));
                      if(recentSortField==="type") return d*((a.procedureType||"").localeCompare(b.procedureType||""));
                      if(recentSortField==="amount") return d*((a.amount||0)-(b.amount||0));
                      if(recentSortField==="performedBy") return d*((a.performedBy||"").localeCompare(b.performedBy||""));
                      if(recentSortField==="performedAt") return d*(new Date(a.performedAt||0).getTime()-new Date(b.performedAt||0).getTime());
                      return 0;
                    });
                    const STATUS_CLR: Record<string,string> = {COMPLETED:"#10b981",PENDING:"#f59e0b",CANCELLED:"#ef4444",IN_PROGRESS:"#6366f1"};
                    return (
                      <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                        <div style={{padding:"16px 18px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <div style={{fontSize:13,fontWeight:700,color:"#1e293b",display:"flex",alignItems:"center",gap:8}}><Clock size={15} color="#f59e0b"/>Recent Procedure Records</div>
                          <button onClick={()=>setTab("records")} style={{fontSize:11,fontWeight:600,color:meta.accent,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>View All <ArrowRight size={12}/></button>
                        </div>
                        {/* Search toolbar */}
                        <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 18px",borderBottom:"1px solid #f1f5f9",flexWrap:"wrap"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"6px 12px",flex:1,minWidth:160}}>
                            <input style={{background:"none",border:"none",outline:"none",fontSize:11,color:"#334155",width:"100%",fontFamily:"inherit"}} placeholder="Search patient, procedure, type..." value={recentSearch} onChange={e=>setRecentSearch(e.target.value)}/>
                            {recentSearch && <button onClick={()=>setRecentSearch("")} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}><X size={11} color="#94a3b8"/></button>}
                          </div>
                          <div style={{fontSize:10,color:"#94a3b8",fontWeight:600}}>{sorted.length} records</div>
                        </div>
                        <div style={{overflowX:"auto"}}>
                          <table style={{width:"100%",borderCollapse:"collapse"}}>
                            <thead>
                              <tr style={{background:"#f8fafc"}}>
                                {[
                                  {k:"patient",l:"Patient"},
                                  {k:"patientId",l:"Patient ID"},
                                  {k:"procedure",l:"Procedure"},
                                  {k:"type",l:"Type"},
                                  {k:"amount",l:"Amount"},
                                  {k:"performedBy",l:"Performed By"},
                                  {k:"performedAt",l:"Date"},
                                ].map(c=>(
                                  <th key={c.k} onClick={()=>handleRecentSort(c.k)} style={{textAlign:"left",fontSize:10,fontWeight:600,color:"#94a3b8",padding:"10px 14px",borderBottom:"2px solid #f1f5f9",whiteSpace:"nowrap",cursor:"pointer",userSelect:"none"}}>
                                    <span style={{display:"inline-flex",alignItems:"center",gap:4}}>{c.l} {sortIcon(c.k,recentSortField,recentSortDir)}</span>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sorted.map((r:any,i:number)=>{
                                const stClr = STATUS_CLR[r.status]||"#94a3b8";
                                return (
                                  <tr key={i} style={{borderBottom:"1px solid #f8fafc"}} onMouseEnter={e=>e.currentTarget.style.background="#fafbfc"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                    <td style={{padding:"10px 14px",fontSize:12,fontWeight:600,color:"#1e293b"}}>{r.patientName}</td>
                                    <td style={{padding:"10px 14px"}}><span style={{fontFamily:"monospace",fontWeight:700,color:"#0369a1",background:"#f0f9ff",padding:"3px 8px",borderRadius:6,fontSize:10}}>{r.patientId||"—"}</span></td>
                                    <td style={{padding:"10px 14px",fontSize:12,color:"#334155"}}>{r.procedureName}</td>
                                    <td style={{padding:"10px 14px"}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:6,fontWeight:700,background:(TYPE_COLORS[r.procedureType]||"#94a3b8")+"18",color:TYPE_COLORS[r.procedureType]||"#94a3b8"}}>{r.procedureType}</span></td>
                                    <td style={{padding:"10px 14px",fontSize:12,fontWeight:700,color:"#059669"}}>₹{(r.amount||0).toLocaleString("en-IN")}</td>
                                    <td style={{padding:"10px 14px",fontSize:12,color:"#64748b"}}>{r.performedBy}</td>
                                    <td style={{padding:"10px 14px",fontSize:11,color:"#64748b",whiteSpace:"nowrap"}}>{r.performedAt?new Date(r.performedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"}):"—"}</td>
                                  </tr>
                                );
                              })}
                              {sorted.length===0 && <tr><td colSpan={7} style={{padding:30,textAlign:"center",color:"#94a3b8",fontSize:11}}>{recentSearch?"No matching records":"No records yet"}</td></tr>}
                            </tbody>
                          </table>
                        </div>
                        {sorted.length>0 && (
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 18px",borderTop:"1px solid #f1f5f9"}}>
                            <div style={{fontSize:11,color:"#94a3b8"}}>Showing {sorted.length} of {allRecent.length}</div>
                            <div style={{fontSize:10,color:"#94a3b8"}}>Sorted by {recentSortField} · {recentSortDir==="desc"?"Newest":"Oldest"}</div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>);
              })()}
            </div>)}

            {/* ═══════════════════ PROCEDURES CRUD ═══════════════════ */}
            {tab==="procedures" && (<>
              {/* Add/Edit Procedure Modal */}
              {showProcForm && (
                <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowProcForm(false)}>
                  <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:540,boxShadow:"0 24px 60px rgba(0,0,0,.18)",fontFamily:"'Inter',sans-serif",animation:"fadeUp .25s ease",maxHeight:"90vh",overflowY:"auto"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                      <div>
                        <div style={{fontSize:17,fontWeight:800,color:"#1e293b"}}>{editingProc?"Edit Procedure":"Add New Procedure"}</div>
                        <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>Fill in the procedure details below</div>
                      </div>
                      <button onClick={()=>setShowProcForm(false)} style={{width:32,height:32,borderRadius:9,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={14} color="#94a3b8"/></button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                      <div style={{gridColumn:"1/-1"}}>
                        <label style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Name *</label>
                        <input value={procForm.name} onChange={e=>setProcForm((f:any)=>({...f,name:e.target.value}))} placeholder="e.g. Dental Scaling" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:12,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                      </div>
                      <div>
                        <label style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Type</label>
                        <select value={procForm.type} onChange={e=>setProcForm((f:any)=>({...f,type:e.target.value}))} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:12,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}>
                          {["DIAGNOSTIC","TREATMENT","CONSULTATION","SURGERY","THERAPY","MEDICATION","OTHER"].map(t=><option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Fee (₹)</label>
                        <input type="number" value={procForm.fee} onChange={e=>setProcForm((f:any)=>({...f,fee:e.target.value}))} placeholder="0" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:12,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                      </div>
                      <div>
                        <label style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Duration (min)</label>
                        <input type="number" value={procForm.duration} onChange={e=>setProcForm((f:any)=>({...f,duration:e.target.value}))} placeholder="30" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:12,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                      </div>
                      <div style={{gridColumn:"1/-1"}}>
                        <label style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Description</label>
                        <input value={procForm.description} onChange={e=>setProcForm((f:any)=>({...f,description:e.target.value}))} placeholder="Optional description" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:12,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                      </div>
                    </div>
                    {procMsg && <div style={{fontSize:11,color:"#ef4444",marginTop:12,fontWeight:600}}>{procMsg}</div>}
                    <div style={{display:"flex",gap:10,marginTop:18,borderTop:"1px solid #f1f5f9",paddingTop:18}}>
                      <button onClick={saveProc} disabled={procSaving} style={{padding:"10px 24px",borderRadius:10,border:"none",background:meta.gradient,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:`0 4px 14px ${meta.accent}33`}}>
                        {procSaving ? <Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/> : <Save size={13}/>}
                        {editingProc?"Save Changes":"Add Procedure"}
                      </button>
                      <button onClick={()=>setShowProcForm(false)} style={{padding:"10px 18px",borderRadius:10,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Ban size={13}/>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Toolbar — matches hospitaladmin/appointments style */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"8px 14px",flex:1,minWidth:200}}>
                  <input style={{background:"none",border:"none",outline:"none",fontSize:12,color:"#334155",width:"100%",fontFamily:"inherit"}}
                    placeholder="Search by name, type..." value={procSearch} onChange={e=>setProcSearch(e.target.value)}/>
                  {procSearch && <button onClick={()=>setProcSearch("")} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}><X size={12} color="#94a3b8"/></button>}
                </div>
                {procsLoading && <Loader2 size={16} color={meta.accent} style={{animation:"spin .7s linear infinite"}}/>}
                <div style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>{filteredProcs.length} procedures</div>
                {selectedProcs.size > 0 && (
                  <button onClick={()=>setShowBulkDeleteProcConfirm(true)}
                    style={{padding:"8px 14px",borderRadius:10,border:"1px solid #fecaca",background:"#fff5f5",fontSize:11,color:"#ef4444",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                    <Trash2 size={12}/>Delete ({selectedProcs.size})
                  </button>
                )}
                {/* Export Dropdown */}
                <div style={{position:"relative",marginLeft:"auto"}}>
                  <button onClick={()=>setProcExportOpen(!procExportOpen)}
                    style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:500,cursor:"pointer"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="#cbd5e1";e.currentTarget.style.background="#f8fafc";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.background="#fff";}}>
                    <Download size={14}/>Export
                  </button>
                  {procExportOpen && (<>
                    <div style={{position:"fixed",inset:0,zIndex:60}} onClick={()=>setProcExportOpen(false)}/>
                    <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,zIndex:70,minWidth:180,padding:6}}>
                      <button onClick={exportProcPDF} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:8,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:12,color:"#334155",fontWeight:500}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <span style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:"#fff5f5",color:"#ef4444"}}><FileText size={13}/></span>Export as PDF
                      </button>
                      <button onClick={exportProcExcel} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:8,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:12,color:"#334155",fontWeight:500}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <span style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:"#f0fdf4",color:"#16a34a"}}><FileSpreadsheet size={13}/></span>Export as Excel
                      </button>
                      <button onClick={exportProcWord} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:8,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:12,color:"#334155",fontWeight:500}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <span style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:"#eff6ff",color:"#2563eb"}}><FileType size={13}/></span>Export as Word
                      </button>
                    </div>
                  </>)}
                </div>
                <button onClick={handleAiAutoAdd} disabled={aiAdding}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"9px 16px",borderRadius:10,border:`1px solid ${meta.borderColor}`,background:meta.lightBg,color:meta.accent,fontSize:12,fontWeight:700,cursor:aiAdding?"not-allowed":"pointer",opacity:aiAdding?.7:1,transition:"all .15s"}}>
                  {aiAdding
                    ? <Loader2 size={14} style={{animation:"spin .7s linear infinite"}}/>
                    : <Wand2 size={14}/>}
                  AI Auto-Add
                </button>
                <button onClick={openAddProc}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"9px 20px",borderRadius:10,border:"none",background:meta.gradient,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
                  <Plus size={15}/>Add Procedure
                </button>
              </div>

              {/* AI Auto-Add feedback banner */}
              {aiMsg && (
                <div style={{
                  display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderRadius:10,marginBottom:14,fontSize:12,fontWeight:600,
                  background: aiMsg.type === "success" ? "#f0fdf4" : aiMsg.type === "info" ? meta.lightBg : "#fff5f5",
                  border: `1px solid ${aiMsg.type === "success" ? "#bbf7d0" : aiMsg.type === "info" ? meta.borderColor : "#fecaca"}`,
                  color: aiMsg.type === "success" ? "#16a34a" : aiMsg.type === "info" ? meta.accent : "#ef4444",
                }}>
                  {aiMsg.type === "success" && <CheckCircle size={14}/>}
                  {aiMsg.type === "info" && <Sparkles size={14}/>}
                  {aiMsg.type === "error" && <AlertCircle size={14}/>}
                  {aiMsg.text}
                  <button onClick={()=>{ if(aiMsgTimerRef.current) clearTimeout(aiMsgTimerRef.current); setAiMsg(null); }}
                    style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",display:"flex",padding:0}}>
                    <X size={12} color="currentColor"/>
                  </button>
                </div>
              )}

              {/* Procedures Table */}
              {filteredProcs.length===0 ? (
                <div style={{textAlign:"center",padding:"60px 20px",background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",color:"#94a3b8"}}>
                  <FlaskConical size={32} style={{marginBottom:10,opacity:.4}}/>
                  <div style={{fontSize:13,fontWeight:600}}>{displayProcs.length===0?"No procedures yet":"No procedures match your search"}</div>
                </div>
              ) : (
                <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden"}}>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead>
                        <tr style={{background:"#f8fafc"}}>
                          <th style={{padding:"12px 10px 12px 14px",borderBottom:"2px solid #f1f5f9",width:36}}>
                            <input type="checkbox" checked={filteredProcs.length>0 && selectedProcs.size===filteredProcs.length} onChange={toggleSelectAllProcs}
                              style={{width:15,height:15,cursor:"pointer",accentColor:meta.accent}}/>
                          </th>
                          {["#","Procedure Name","Type","Fee","Duration","Status","Actions"].map(h=>(
                            <th key={h} style={{textAlign:"left",fontSize:10,fontWeight:600,color:"#94a3b8",padding:"12px 14px",borderBottom:"2px solid #f1f5f9",whiteSpace:"nowrap"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProcs.map((p:any,i:number)=>{
                          const isSelected = selectedProcs.has(p.id);
                          return (
                            <tr key={p.id} style={{borderBottom:"1px solid #f8fafc",background:isSelected?meta.lightBg:"transparent"}}
                              onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.background="#fafbfc";}}
                              onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.background="transparent";}}>
                              <td style={{padding:"12px 10px 12px 14px",width:36}}>
                                <input type="checkbox" checked={isSelected} onChange={()=>toggleSelectProc(p.id)}
                                  style={{width:15,height:15,cursor:"pointer",accentColor:meta.accent}}/>
                              </td>
                              <td style={{padding:"12px 14px",color:"#94a3b8",fontWeight:600,fontSize:11}}>{i+1}</td>
                              <td style={{padding:"12px 14px"}}>
                                <div style={{display:"flex",alignItems:"center",gap:10}}>
                                  <div style={{width:32,height:32,borderRadius:9,background:(PROC_TYPE_COLOR[p.type]||"#94a3b8")+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                    <FlaskConical size={14} color={PROC_TYPE_COLOR[p.type]||"#94a3b8"}/>
                                  </div>
                                  <div>
                                    <div style={{fontSize:12,fontWeight:600,color:p.isActive?"#1e293b":"#94a3b8"}}>{p.name}</div>
                                    {p.description && <div style={{fontSize:10,color:"#94a3b8",marginTop:1}}>{p.description}</div>}
                                  </div>
                                </div>
                              </td>
                              <td style={{padding:"12px 14px"}}><span style={{fontSize:10,padding:"3px 8px",borderRadius:100,background:(PROC_TYPE_COLOR[p.type]||"#94a3b8")+"18",color:PROC_TYPE_COLOR[p.type]||"#94a3b8",fontWeight:600}}>{p.type}</span></td>
                              <td style={{padding:"12px 14px",fontWeight:700,color:p.fee!=null?"#0A6B70":"#94a3b8",fontSize:12}}>{p.fee!=null?`₹${p.fee}`:"—"}</td>
                              <td style={{padding:"12px 14px",fontSize:12,color:"#64748b"}}>{p.duration?`${p.duration} min`:"—"}</td>
                              <td style={{padding:"12px 14px"}}>
                                <button onClick={()=>toggleProcActive(p)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                                  {p.isActive
                                    ? <><ToggleRight size={18} color="#22c55e"/><span style={{fontSize:10,fontWeight:700,color:"#16a34a"}}>Active</span></>
                                    : <><ToggleLeft size={18} color="#94a3b8"/><span style={{fontSize:10,fontWeight:600,color:"#94a3b8"}}>Inactive</span></>}
                                </button>
                              </td>
                              <td style={{padding:"12px 14px"}}>
                                <div style={{display:"flex",gap:6}}>
                                  <button onClick={()=>openEditProc(p)} style={{width:28,height:28,borderRadius:8,border:"none",background:"#E6F4F4",color:"#0E898F",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="Edit"><Edit2 size={13}/></button>
                                  <button onClick={()=>setDeleteProcTarget(p)} style={{width:28,height:28,borderRadius:8,border:"none",background:"#fff5f5",color:"#ef4444",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="Delete"><Trash2 size={13}/></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Footer */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderTop:"1px solid #f1f5f9"}}>
                    <div style={{fontSize:11,color:"#94a3b8"}}>Showing {filteredProcs.length} of {displayProcs.length} procedures</div>
                    <div style={{fontSize:10,color:"#94a3b8"}}>{activeProcs.length} active · {displayProcs.length - activeProcs.length} inactive</div>
                  </div>
                </div>
              )}

              {/* Single Delete Confirmation Modal */}
              {deleteProcTarget && (
                <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
                  onClick={e=>{if(e.target===e.currentTarget && !deletingProc) setDeleteProcTarget(null);}}>
                  <div style={{background:"#fff",borderRadius:16,padding:24,width:"100%",maxWidth:440,border:"1px solid #e2e8f0"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:18}}>
                      <div style={{width:40,height:40,borderRadius:10,background:"#fff5f5",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <AlertTriangle size={20} color="#ef4444"/>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:15,fontWeight:700,color:"#1e293b",marginBottom:4}}>Delete Procedure?</div>
                        <div style={{fontSize:12,color:"#64748b",lineHeight:1.5}}>
                          Are you sure you want to delete <strong>{deleteProcTarget.name}</strong> ({deleteProcTarget.type})? This cannot be undone.
                        </div>
                      </div>
                    </div>
                    {deleteProcTarget.fee!=null && (
                      <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:12,marginBottom:18}}>
                        <div style={{fontSize:11,color:"#92400e",fontWeight:600,marginBottom:4}}>⚠️ Warning</div>
                        <div style={{fontSize:10,color:"#a16207"}}>This procedure with fee ₹{deleteProcTarget.fee} will be permanently removed from your catalog.</div>
                      </div>
                    )}
                    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                      <button onClick={()=>setDeleteProcTarget(null)} disabled={deletingProc}
                        style={{padding:"9px 18px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:deletingProc?"not-allowed":"pointer",opacity:deletingProc?.5:1}}>Cancel</button>
                      <button onClick={handleDeleteSingleProc} disabled={deletingProc}
                        style={{padding:"9px 18px",borderRadius:9,border:"none",background:"#ef4444",color:"#fff",fontSize:12,fontWeight:700,cursor:deletingProc?"not-allowed":"pointer",opacity:deletingProc?.7:1,display:"flex",alignItems:"center",gap:6}}>
                        {deletingProc && <Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/>}
                        {deletingProc?"Deleting...":"Delete Procedure"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bulk Delete Confirmation Modal */}
              {showBulkDeleteProcConfirm && (
                <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
                  onClick={e=>{if(e.target===e.currentTarget && !bulkDeletingProcs) setShowBulkDeleteProcConfirm(false);}}>
                  <div style={{background:"#fff",borderRadius:16,padding:24,width:"100%",maxWidth:440,border:"1px solid #e2e8f0"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:18}}>
                      <div style={{width:40,height:40,borderRadius:10,background:"#fff5f5",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <AlertTriangle size={20} color="#ef4444"/>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:15,fontWeight:700,color:"#1e293b",marginBottom:4}}>Delete {selectedProcs.size} Procedures?</div>
                        <div style={{fontSize:12,color:"#64748b",lineHeight:1.5}}>
                          Are you sure you want to delete <strong>{selectedProcs.size}</strong> selected procedure(s)? This action cannot be undone.
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                      <button onClick={()=>setShowBulkDeleteProcConfirm(false)} disabled={bulkDeletingProcs}
                        style={{padding:"9px 18px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:bulkDeletingProcs?"not-allowed":"pointer",opacity:bulkDeletingProcs?.5:1}}>Cancel</button>
                      <button onClick={bulkDeleteProcs} disabled={bulkDeletingProcs}
                        style={{padding:"9px 18px",borderRadius:9,border:"none",background:"#ef4444",color:"#fff",fontSize:12,fontWeight:700,cursor:bulkDeletingProcs?"not-allowed":"pointer",opacity:bulkDeletingProcs?.7:1,display:"flex",alignItems:"center",gap:6}}>
                        {bulkDeletingProcs && <Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/>}
                        {bulkDeletingProcs?"Deleting...":`Delete ${selectedProcs.size} Procedures`}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>)}

            {/* ═══════════════════ PATIENT RECORDS ═══════════════════ */}
            {tab==="records" && (<>
              {/* Procedure Stats */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:20}}>
                {[
                  {label:"Today's Procedures", value:recordsMeta.todayRecords||0,  color:"#6366f1", bg:"#eef2ff", border:"#c7d2fe"},
                  {label:"Total Procedures Done",value:recordsMeta.totalRecords||0, color:meta.accent, bg:meta.lightBg, border:meta.borderColor},
                ].map((s,i)=>(
                  <div key={i} style={{background:s.bg,borderRadius:12,padding:"16px",border:`1px solid ${s.border}`}}>
                    <div style={{fontSize:26,fontWeight:800,color:s.color}}>{s.value}</div>
                    <div style={{fontSize:11,color:"#64748b",marginTop:3}}>{s.label}</div>
                    {i===0&&<div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>Billing managed by Finance Dept</div>}
                  </div>
                ))}
              </div>

              {/* Record Procedure Modal */}
              {showRecordForm && (
                <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>{ if(!recordSuccessData) closeRecordModal(); }}>
                  <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:580,border:"1px solid #e2e8f0",fontFamily:"'Inter',sans-serif",animation:"fadeUp .25s ease",maxHeight:"90vh",overflowY:"auto"}}>

                    {/* ── SUCCESS VIEW ── */}
                    {recordSuccessData ? (<>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:36,height:36,borderRadius:10,background:"#f0fdf4",border:"1px solid #bbf7d0",display:"flex",alignItems:"center",justifyContent:"center"}}><CheckCircle size={18} color="#16a34a"/></div>
                          <div>
                            <div style={{fontSize:15,fontWeight:800,color:"#166534"}}>Procedure Recorded!</div>
                            <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>Record saved successfully</div>
                          </div>
                        </div>
                        <button onClick={closeRecordModal} style={{width:32,height:32,borderRadius:9,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={14} color="#94a3b8"/></button>
                      </div>

                      {/* Patient + Procedure summary */}
                      <div style={{background:"#f8fafc",borderRadius:12,padding:"14px 16px",marginBottom:16,border:"1px solid #e2e8f0"}}>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                          <div><div style={{fontSize:10,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:".06em"}}>Patient</div><div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginTop:2}}>{recordSuccessData.patient?.name}</div><div style={{fontSize:11,color:"#64748b"}}>{recordSuccessData.patient?.patientId}</div></div>
                          <div><div style={{fontSize:10,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:".06em"}}>Procedure</div><div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginTop:2}}>{recordSuccessData.procedure?.name}</div><div style={{fontSize:11,color:"#64748b"}}>₹{Number(recordSuccessData.amount||0).toLocaleString("en-IN",{minimumFractionDigits:2})}</div></div>
                        </div>
                      </div>

                      {/* Bill section */}
                      {recordSuccessBill ? (<>
                        <div style={{fontSize:12,fontWeight:700,color:"#334155",marginBottom:10,display:"flex",alignItems:"center",gap:6}}><Receipt size={14} color={meta.accent}/>Generated Bill</div>
                        <div style={{border:`1px solid ${meta.borderColor}`,borderRadius:12,overflow:"hidden",marginBottom:16}}>
                          {/* Bill header */}
                          <div style={{background:meta.lightBg,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${meta.borderColor}`}}>
                            <div style={{fontSize:12,fontWeight:700,color:meta.accent}}>{recordSuccessBill.billNo || "—"}</div>
                            <span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:6,background: recordSuccessBill.status==="PAID" ? "#f0fdf4" : "#fef3c7",color: recordSuccessBill.status==="PAID" ? "#16a34a" : "#b45309",border:`1px solid ${recordSuccessBill.status==="PAID" ? "#bbf7d0" : "#fde68a"}`}}>{recordSuccessBill.status || "PENDING"}</span>
                          </div>
                          {/* Procedure items only */}
                          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                            <thead><tr style={{background:"#f8fafc"}}><th style={{padding:"8px 14px",textAlign:"left",fontWeight:700,color:"#64748b",fontSize:10,textTransform:"uppercase"}}>Procedure</th><th style={{padding:"8px 14px",textAlign:"right",fontWeight:700,color:"#64748b",fontSize:10,textTransform:"uppercase"}}>Amount</th></tr></thead>
                            <tbody>
                              {(recordSuccessBill.billItems||[]).filter((bi:any)=>bi.type==="PROCEDURE").map((bi:any,i:number)=>(
                                <tr key={bi.id||i} style={{borderTop:"1px solid #f1f5f9"}}>
                                  <td style={{padding:"10px 14px",color:"#1e293b",fontWeight:600}}>{bi.name}</td>
                                  <td style={{padding:"10px 14px",textAlign:"right",fontWeight:700,color:meta.accent}}>₹{Number(bi.amount||0).toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr style={{borderTop:`2px solid ${meta.borderColor}`,background:meta.lightBg}}>
                                <td style={{padding:"10px 14px",fontWeight:800,color:"#1e293b",fontSize:13}}>Total Procedure Charges</td>
                                <td style={{padding:"10px 14px",textAlign:"right",fontWeight:800,color:meta.accent,fontSize:14}}>₹{(recordSuccessBill.billItems||[]).filter((bi:any)=>bi.type==="PROCEDURE").reduce((s:number,bi:any)=>s+Number(bi.amount||0),0).toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                        <div style={{display:"flex",gap:10}}>
                          <button onClick={()=>{ const billId = recordSuccessBill?.id; closeRecordModal(); if(billId){ setAutoCollectBillId(billId); setTab("billing"); } }} style={{flex:1,padding:"11px 18px",borderRadius:10,border:"none",background:meta.gradient,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><CreditCard size={13}/>Collect &amp; Generate Bill</button>
                          <button onClick={()=>{closeRecordModal();setShowRecordForm(true);}} style={{padding:"11px 18px",borderRadius:10,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Plus size={13}/>New Record</button>
                          <button onClick={closeRecordModal} style={{padding:"11px 18px",borderRadius:10,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>Close</button>
                        </div>
                      </>) : (
                        <div style={{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:10,padding:"12px 16px",marginBottom:16,fontSize:12,color:"#92400e"}}>
                          <b>Note:</b> Bill could not be generated automatically. This record may not be linked to an appointment. You can view it in the Billing section once transferred.
                        </div>
                      )}
                      {!recordSuccessBill && <button onClick={closeRecordModal} style={{width:"100%",padding:"11px",borderRadius:10,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>Close</button>}
                    </>) : (<>

                    {/* ── FORM VIEW ── */}
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                      <div>
                        <div style={{fontSize:17,fontWeight:800,color:"#1e293b"}}>Record Procedure Performed</div>
                        <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>Log a procedure done on a patient</div>
                      </div>
                      <button onClick={closeRecordModal} style={{width:32,height:32,borderRadius:9,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={14} color="#94a3b8"/></button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                      {/* Patient search */}
                      <div style={{gridColumn:"1/-1",position:"relative"}}>
                        <label style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Patient *</label>
                        <input value={recordForm.patientSearch} onChange={e=>{ setRecordForm((f:any)=>({...f,patientSearch:e.target.value,patientId:""})); searchPatients(e.target.value); }}
                          placeholder="Search patient by name, ID or phone…" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:12,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                        {patientResults.length>0 && !recordForm.patientId && (
                          <div style={{position:"absolute",zIndex:50,top:"100%",left:0,right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden",maxHeight:220,overflowY:"auto"}}>
                            {patientResults.map((pt:any)=>(
                              <div key={pt.id} onClick={()=>{ setRecordForm((f:any)=>({...f,patientId:pt.id,patientSearch:`${pt.name} (${pt.patientId})`})); setPatientResults([]); }}
                                style={{padding:"10px 14px",cursor:"pointer",fontSize:12,borderBottom:"1px solid #f8fafc",display:"flex",alignItems:"center",gap:8}} onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")} onMouseLeave={e=>(e.currentTarget.style.background="#fff")}>
                                <div style={{width:28,height:28,borderRadius:8,background:meta.gradient,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:10,flexShrink:0}}>{pt.name?.charAt(0)}</div>
                                <div><div style={{fontWeight:600,color:"#1e293b"}}>{pt.name}</div><div style={{fontSize:10,color:"#94a3b8"}}>{pt.patientId} · {pt.phone}</div></div>
                              </div>
                            ))}
                          </div>
                        )}
                        {recordForm.patientId && <div style={{marginTop:4,fontSize:10,color:"#16a34a",fontWeight:600}}>✓ Patient selected</div>}
                      </div>
                      {/* Procedure */}
                      <div>
                        <label style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Procedure *</label>
                        <select value={recordForm.procedureId} onChange={e=>{ const p = displayProcs.find((x:any)=>x.id===e.target.value); setRecordForm((f:any)=>({...f,procedureId:e.target.value,amount:p?.fee?.toString()||f.amount})); }}
                          style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:12,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}>
                          <option value="">— Select Procedure —</option>
                          {displayProcs.filter((p:any)=>p.isActive).map((p:any)=>(
                            <option key={p.id} value={p.id}>{p.name}{p.fee!=null?` — ₹${p.fee}`:""}</option>
                          ))}
                        </select>
                      </div>
                      {/* Amount */}
                      <div>
                        <label style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Amount Charged (₹) *</label>
                        <input type="number" value={recordForm.amount} onChange={e=>setRecordForm((f:any)=>({...f,amount:e.target.value}))} placeholder="0" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:12,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                      </div>
                      {/* Performed by */}
                      <div>
                        <label style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Performed By</label>
                        <input value={recordForm.performedBy} onChange={e=>setRecordForm((f:any)=>({...f,performedBy:e.target.value}))} placeholder={hodName} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:12,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                      </div>
                      {/* Status */}
                      <div>
                        <label style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Status</label>
                        <select value={recordForm.status} onChange={e=>setRecordForm((f:any)=>({...f,status:e.target.value}))} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:12,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}>
                          {["PENDING","IN_PROGRESS","COMPLETED","CANCELLED"].map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                        </select>
                      </div>
                      {/* Notes */}
                      <div style={{gridColumn:"1/-1"}}>
                        <label style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Notes</label>
                        <input value={recordForm.notes} onChange={e=>setRecordForm((f:any)=>({...f,notes:e.target.value}))} placeholder="Optional procedure notes" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:12,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                      </div>
                    </div>
                    {recordMsg && <div style={{fontSize:11,color:"#ef4444",marginTop:12,fontWeight:600}}>{recordMsg}</div>}
                    <div style={{display:"flex",gap:10,marginTop:18,borderTop:"1px solid #f1f5f9",paddingTop:18}}>
                      <button onClick={saveRecord} disabled={recordSaving} style={{padding:"10px 24px",borderRadius:10,border:"none",background:meta.gradient,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                        {recordSaving ? <Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/> : <Save size={13}/>}
                        Save Record
                      </button>
                      <button onClick={()=>{setShowRecordForm(false);setRecordForm(BLANK_REC);}} style={{padding:"10px 18px",borderRadius:10,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Ban size={13}/>Cancel</button>
                    </div>
                    </>)}
                  </div>
                </div>
              )}

              {/* Toolbar — matches hospitaladmin/appointments style */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"8px 14px",flex:1,minWidth:200}}>
                  <input style={{background:"none",border:"none",outline:"none",fontSize:12,color:"#334155",width:"100%",fontFamily:"inherit"}}
                    placeholder="Search by patient, procedure, ID..." value={recordsSearch} onChange={e=>{setRecordsSearch(e.target.value);loadRecords(e.target.value);}}/>
                  {recordsSearch && <button onClick={()=>{setRecordsSearch("");loadRecords("");}} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}><X size={12} color="#94a3b8"/></button>}
                </div>
                {recordsLoading && <Loader2 size={16} color={meta.accent} style={{animation:"spin .7s linear infinite"}}/>}
                <div style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>{sortedRecords.length} records</div>
                {selectedRecords.size > 0 && (
                  <button onClick={()=>setShowBulkDeleteConfirm(true)}
                    style={{padding:"8px 14px",borderRadius:10,border:"1px solid #fecaca",background:"#fff5f5",fontSize:11,color:"#ef4444",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                    <Trash2 size={12}/>Delete ({selectedRecords.size})
                  </button>
                )}
                {/* Export Dropdown */}
                <div style={{position:"relative",marginLeft:"auto"}}>
                  <button onClick={()=>setExportDropdown(exportDropdown==="all"?null:"all")}
                    style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:500,cursor:"pointer"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="#cbd5e1";e.currentTarget.style.background="#f8fafc";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.background="#fff";}}>
                    <Download size={14}/>Export
                  </button>
                  {exportDropdown==="all" && (<>
                    <div style={{position:"fixed",inset:0,zIndex:60}} onClick={()=>setExportDropdown(null)}/>
                    <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,zIndex:70,minWidth:180,padding:6}}>
                      <button onClick={()=>exportPDF(selectedRecords.size>0?"selected":"all")} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:8,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:12,color:"#334155",fontWeight:500}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <span style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:"#fff5f5",color:"#ef4444"}}><FileText size={13}/></span>Export as PDF
                      </button>
                      <button onClick={()=>exportExcel(selectedRecords.size>0?"selected":"all")} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:8,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:12,color:"#334155",fontWeight:500}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <span style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:"#f0fdf4",color:"#16a34a"}}><FileSpreadsheet size={13}/></span>Export as Excel
                      </button>
                      <button onClick={()=>exportWord(selectedRecords.size>0?"selected":"all")} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:8,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:12,color:"#334155",fontWeight:500}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <span style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:"#eff6ff",color:"#2563eb"}}><FileType size={13}/></span>Export as Word
                      </button>
                    </div>
                  </>)}
                </div>
                <button onClick={()=>setShowRecordForm(true)}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"9px 20px",borderRadius:10,border:"none",background:meta.gradient,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
                  <Plus size={15}/>New Record
                </button>
              </div>

              {/* Records Table */}
              {records.length===0 ? (
                <div style={{textAlign:"center",padding:"60px 20px",background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",color:"#94a3b8"}}>
                  <IndianRupee size={32} style={{marginBottom:10,opacity:.4}}/>
                  <div style={{fontSize:13,fontWeight:600}}>No procedure records found</div>
                </div>
              ) : (
                <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden"}}>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead>
                        <tr style={{background:"#f8fafc"}}>
                          <th style={{padding:"12px 10px 12px 14px",borderBottom:"2px solid #f1f5f9",width:36}}>
                            <input type="checkbox" checked={sortedRecords.length>0 && selectedRecords.size===sortedRecords.length} onChange={toggleSelectAll}
                              style={{width:15,height:15,cursor:"pointer",accentColor:meta.accent}}/>
                          </th>
                          {[
                            {key:"performedAt",label:"Date"},
                            {key:"patient",label:"Patient"},
                            {key:"procedure",label:"Procedure"},
                            {key:"type",label:"Type"},
                            {key:"amount",label:"Amount"},
                            {key:"performedBy",label:"Performed By"},
                            {key:"status",label:"Status"},
                          ].map(col=>(
                            <th key={col.key} onClick={()=>handleSort(col.key)}
                              style={{textAlign:"left",fontSize:10,fontWeight:600,color:"#94a3b8",padding:"12px 14px",borderBottom:"2px solid #f1f5f9",whiteSpace:"nowrap",cursor:"pointer",userSelect:"none"}}>
                              <span style={{display:"inline-flex",alignItems:"center",gap:4}}>
                                {col.label}
                                {sortField===col.key ? (sortDir==="asc" ? <ChevronUp size={12}/> : <ChevronDown size={12}/>) : <ArrowUpDown size={10} style={{opacity:.35}}/>}
                              </span>
                            </th>
                          ))}
                          <th style={{textAlign:"left",fontSize:10,fontWeight:600,color:"#94a3b8",padding:"12px 14px",borderBottom:"2px solid #f1f5f9",whiteSpace:"nowrap"}}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedRecords.map((r:any)=>{
                          const isSelected = selectedRecords.has(r.id);
                          return (
                            <tr key={r.id} style={{borderBottom:"1px solid #f8fafc",background:isSelected?meta.lightBg:"transparent"}}
                              onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.background="#fafbfc";}}
                              onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.background="transparent";}}>
                              <td style={{padding:"12px 10px 12px 14px",width:36}}>
                                <input type="checkbox" checked={isSelected} onChange={()=>toggleSelectRecord(r.id)}
                                  style={{width:15,height:15,cursor:"pointer",accentColor:meta.accent}}/>
                              </td>
                              <td style={{padding:"12px 14px",fontSize:11,color:"#64748b",whiteSpace:"nowrap"}}>
                                {new Date(r.performedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}<br/>
                                <span style={{fontSize:10,color:"#94a3b8"}}>{new Date(r.performedAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span>
                              </td>
                              <td style={{padding:"12px 14px"}}>
                                <div style={{display:"flex",alignItems:"center",gap:10}}>
                                  <div style={{width:32,height:32,borderRadius:9,background:meta.gradient,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:11,flexShrink:0}}>
                                    {(r.patient?.name||"P").charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{fontSize:12,fontWeight:600,color:"#1e293b"}}>{r.patient?.name||"—"}</div>
                                    <div style={{fontSize:10,color:"#94a3b8"}}>{r.patient?.patientId} · {r.patient?.phone}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{padding:"12px 14px",fontSize:12,fontWeight:600,color:"#334155"}}>{r.procedure?.name||"—"}</td>
                              <td style={{padding:"12px 14px"}}><span style={{fontSize:10,padding:"3px 8px",borderRadius:100,background:(PROC_TYPE_COLOR[r.procedure?.type]||"#94a3b8")+"18",color:PROC_TYPE_COLOR[r.procedure?.type]||"#94a3b8",fontWeight:600}}>{r.procedure?.type||"—"}</span></td>
                              <td style={{padding:"12px 14px",fontWeight:700,color:"#0A6B70",fontSize:12}}>₹{r.amount}</td>
                              <td style={{padding:"12px 14px",fontSize:12,color:"#64748b"}}>{r.performedBy||"—"}</td>
                              <td style={{padding:"12px 14px"}}>
                                <span style={{fontSize:10,padding:"3px 8px",borderRadius:100,fontWeight:700,
                                  background:r.status==="COMPLETED"?"#f0fdf4":r.status==="CANCELLED"?"#fff5f5":"#fffbeb",
                                  color:r.status==="COMPLETED"?"#16a34a":r.status==="CANCELLED"?"#ef4444":"#b45309",
                                  border:`1px solid ${r.status==="COMPLETED"?"#bbf7d0":r.status==="CANCELLED"?"#fecaca":"#fde68a"}`
                                }}>{r.status.replace(/_/g," ")}</span>
                              </td>
                              <td style={{padding:"12px 14px"}}>
                                <div style={{display:"flex",gap:6}}>
                                  <button onClick={()=>setViewingRecord(r)} style={{width:28,height:28,borderRadius:8,border:"none",background:"#E6F4F4",color:"#0E898F",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="View Details"><Eye size={13}/></button>
                                  <button onClick={()=>setEditingRecord(r)} style={{width:28,height:28,borderRadius:8,border:"none",background:"#fef3c7",color:"#d97706",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="Edit"><Edit2 size={13}/></button>
                                  <button onClick={()=>{setTransferTarget(r);setTransferForm({subDeptId:"",notes:""});}} style={{width:28,height:28,borderRadius:8,border:"none",background:"#f0fdf4",color:"#10b981",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="Transfer"><ArrowRight size={13}/></button>
                                  {r.appointment?.id && (
                                    <button onClick={()=>setViewPrescription(r.appointment)} style={{width:28,height:28,borderRadius:8,border:"none",background:"#fdf4ff",color:"#a855f7",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="Prescription"><FileText size={13}/></button>
                                  )}
                                  <button onClick={()=>setDeleteRecordTarget(r)} style={{width:28,height:28,borderRadius:8,border:"none",background:"#fff5f5",color:"#ef4444",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="Delete"><Trash2 size={13}/></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Footer */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderTop:"1px solid #f1f5f9"}}>
                    <div style={{fontSize:11,color:"#94a3b8"}}>Showing {sortedRecords.length} of {recordsMeta.totalRecords||sortedRecords.length}</div>
                    <div style={{fontSize:10,color:"#94a3b8"}}>Sorted by {sortField==="performedAt"?"Date":sortField.charAt(0).toUpperCase()+sortField.slice(1)} · {sortDir==="desc"?"Newest first":"Oldest first"}</div>
                  </div>
                </div>
              )}

              {/* Single Delete Confirmation Modal */}
              {deleteRecordTarget && (
                <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
                  onClick={e=>{if(e.target===e.currentTarget && !deletingRecord) setDeleteRecordTarget(null);}}>
                  <div style={{background:"#fff",borderRadius:16,padding:24,width:"100%",maxWidth:440,border:"1px solid #e2e8f0"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:18}}>
                      <div style={{width:40,height:40,borderRadius:10,background:"#fff5f5",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <AlertTriangle size={20} color="#ef4444"/>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:15,fontWeight:700,color:"#1e293b",marginBottom:4}}>Delete Record?</div>
                        <div style={{fontSize:12,color:"#64748b",lineHeight:1.5}}>
                          Are you sure you want to delete the procedure record for <strong>{deleteRecordTarget.patient?.name}</strong> — <strong>{deleteRecordTarget.procedure?.name}</strong>? This cannot be undone.
                        </div>
                      </div>
                    </div>
                    <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:12,marginBottom:18}}>
                      <div style={{fontSize:11,color:"#92400e",fontWeight:600,marginBottom:4}}>⚠️ Warning</div>
                      <div style={{fontSize:10,color:"#a16207"}}>This record with amount ₹{deleteRecordTarget.amount} will be permanently removed.</div>
                    </div>
                    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                      <button onClick={()=>setDeleteRecordTarget(null)} disabled={deletingRecord}
                        style={{padding:"9px 18px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:deletingRecord?"not-allowed":"pointer",opacity:deletingRecord?.5:1}}>Cancel</button>
                      <button onClick={handleDeleteSingleRecord} disabled={deletingRecord}
                        style={{padding:"9px 18px",borderRadius:9,border:"none",background:"#ef4444",color:"#fff",fontSize:12,fontWeight:700,cursor:deletingRecord?"not-allowed":"pointer",opacity:deletingRecord?.7:1,display:"flex",alignItems:"center",gap:6}}>
                        {deletingRecord && <Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/>}
                        {deletingRecord?"Deleting...":"Delete Record"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bulk Delete Confirmation Modal */}
              {showBulkDeleteConfirm && (
                <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
                  onClick={e=>{if(e.target===e.currentTarget && !bulkDeleteRunning) setShowBulkDeleteConfirm(false);}}>
                  <div style={{background:"#fff",borderRadius:16,padding:24,width:"100%",maxWidth:440,border:"1px solid #e2e8f0"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:18}}>
                      <div style={{width:40,height:40,borderRadius:10,background:"#fff5f5",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <AlertTriangle size={20} color="#ef4444"/>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:15,fontWeight:700,color:"#1e293b",marginBottom:4}}>Delete {selectedRecords.size} Records?</div>
                        <div style={{fontSize:12,color:"#64748b",lineHeight:1.5}}>
                          Are you sure you want to delete <strong>{selectedRecords.size}</strong> selected record(s)? This action cannot be undone and will permanently remove the procedure data.
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                      <button onClick={()=>setShowBulkDeleteConfirm(false)} disabled={bulkDeleteRunning}
                        style={{padding:"9px 18px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:bulkDeleteRunning?"not-allowed":"pointer",opacity:bulkDeleteRunning?.5:1}}>Cancel</button>
                      <button onClick={bulkDeleteRecords} disabled={bulkDeleteRunning}
                        style={{padding:"9px 18px",borderRadius:9,border:"none",background:"#ef4444",color:"#fff",fontSize:12,fontWeight:700,cursor:bulkDeleteRunning?"not-allowed":"pointer",opacity:bulkDeleteRunning?.7:1,display:"flex",alignItems:"center",gap:6}}>
                        {bulkDeleteRunning && <Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/>}
                        {bulkDeleteRunning?"Deleting...":`Delete ${selectedRecords.size} Records`}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>)}

            {/* ═══════════════════ APPOINTMENTS (Reception) ═══════════════════ */}
            {tab==="appointments" && <AppointmentPanelLazy />}

            {/* ═══════════════════ BILLING ═══════════════════ */}
            {tab==="billing" && (
              ["PROCEDURE","CLINICAL_PROCEDURE","OT","SURGERY","ACCOUNTS","OTHER","CUSTOM"].includes(deptType)
                ? <BillingQueueLazy scope="procedure" subDeptId={profile?.id} deptName={deptName} defaultCollectBillId={autoCollectBillId} onDefaultCollectConsumed={()=>setAutoCollectBillId(undefined)} />
                : <BillingQueueLazy deptName={deptName} defaultCollectBillId={autoCollectBillId} onDefaultCollectConsumed={()=>setAutoCollectBillId(undefined)} />
            )}

            {/* ═══════════════════ PATIENTS (Reception) ═══════════════════ */}
            {tab==="patients" && <PatientsManagementPanelLazy/>}

            {/* ═══════════════════ DOCTORS (Reception) ═══════════════════ */}
            {tab==="doctors" && <DoctorPanelLazy />}

            {/* ═══════════════════ INVENTORY (Department Stock) ═══════════════════ */}
            {tab==="inventory" && <AdminInventoryPanelLazy />}

            {/* ═══════════════════ REVENUE / EXPENSE ═══════════════════ */}
            {tab === "revenue" && (
              <div style={{animation:"fadeUp .25s ease"}}>
                {/* Header */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:10}}>
                  <div>
                    <div style={{fontSize:17,fontWeight:800,color:"#1e293b",display:"flex",alignItems:"center",gap:8}}><IndianRupee size={18} color={meta.accent}/> Revenue &amp; Expenses</div>
                    <div style={{fontSize:11,color:"#64748b",marginTop:2}}>Pharmacy financial overview — sales revenue vs. purchase expenses</div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    {(["today","week","month","all"] as const).map(p=>(
                      <button key={p} onClick={()=>setRevExpPeriod(p)} style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${revExpPeriod===p?meta.accent:"#e2e8f0"}`,background:revExpPeriod===p?meta.lightBg:"#fff",color:revExpPeriod===p?meta.accent:"#64748b",fontSize:10,fontWeight:600,cursor:"pointer",textTransform:"capitalize"}}>{p==="all"?"All Time":p.charAt(0).toUpperCase()+p.slice(1)}</button>
                    ))}
                    <button onClick={()=>loadRevExp(revExpPeriod)} style={{padding:"6px 12px",borderRadius:20,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:10,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><RefreshCw size={12}/> Refresh</button>
                    <button onClick={()=>{setShowAddExpense(true);setExpenseForm({title:"",amount:"",category:"OTHER",date:new Date().toISOString().split("T")[0],description:""});}} style={{padding:"6px 14px",borderRadius:20,border:"none",background:meta.accent,color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Plus size={12}/> Add Expense</button>
                  </div>
                </div>

                {revExpLoading ? (
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"60px 0",color:"#94a3b8",gap:10}}><Loader2 size={20} style={{animation:"spin .7s linear infinite"}}/> Loading financial data...</div>
                ) : !revExpData ? (
                  <div style={{textAlign:"center",padding:"60px 0",color:"#94a3b8",fontSize:13}}>No data yet. Make some sales or purchases to see your financial overview.</div>
                ) : (<>
                  {/* Summary Cards */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
                    {[
                      {label:"Total Revenue",val:revExpData.revenue?.total||0,color:"#16a34a",bg:"#f0fdf4",border:"#bbf7d0",icon:<TrendingUp size={18} color="#16a34a"/>},
                      {label:"Total Expenses",val:revExpData.expenses?.total||0,color:"#ef4444",bg:"#fff5f5",border:"#fecaca",icon:<AlertTriangle size={18} color="#ef4444"/>},
                      {label:"Net Profit",val:revExpData.net||0,color:(revExpData.net||0)>=0?"#16a34a":"#ef4444",bg:(revExpData.net||0)>=0?"#f0fdf4":"#fff5f5",border:(revExpData.net||0)>=0?"#bbf7d0":"#fecaca",icon:<IndianRupee size={18} color={(revExpData.net||0)>=0?"#16a34a":"#ef4444"}/>},
                    ].map((c,i)=>(
                      <div key={i} style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:14,padding:"18px 20px",display:"flex",alignItems:"center",gap:14}}>
                        <div style={{width:44,height:44,borderRadius:12,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,.06)",flexShrink:0}}>{c.icon}</div>
                        <div>
                          <div style={{fontSize:10,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em"}}>{c.label}</div>
                          <div style={{fontSize:20,fontWeight:800,color:c.color,marginTop:2}}>₹{(c.val).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Two column: Revenue table + Expense table */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                    {/* Revenue — Bills */}
                    <div className="sd2-card">
                      <div className="sd2-card-hd" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span className="sd2-card-title"><TrendingUp size={14} color="#16a34a"/> Sales Revenue ({revExpData.revenue?.items?.length||0})</span>
                      </div>
                      {(revExpData.revenue?.items||[]).length===0 ? (
                        <div style={{padding:"28px",textAlign:"center",color:"#94a3b8",fontSize:11}}>No sales yet for this period</div>
                      ) : (
                        <div style={{maxHeight:400,overflowY:"auto"}}>
                          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                            <thead><tr style={{background:"#f8fafc"}}>
                              <th style={{padding:"8px 12px",textAlign:"left",fontWeight:700,color:"#64748b",fontSize:10}}>Bill No</th>
                              <th style={{padding:"8px 12px",textAlign:"left",fontWeight:700,color:"#64748b",fontSize:10}}>Patient</th>
                              <th style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:"#64748b",fontSize:10}}>Amount</th>
                              <th style={{padding:"8px 12px",textAlign:"center",fontWeight:700,color:"#64748b",fontSize:10}}>Status</th>
                            </tr></thead>
                            <tbody>
                              {(revExpData.revenue?.items||[]).map((b:any,i:number)=>(
                                <tr key={i} style={{borderTop:"1px solid #f1f5f9"}}>
                                  <td style={{padding:"8px 12px",fontWeight:600,color:"#1e293b"}}>{b.billNo}</td>
                                  <td style={{padding:"8px 12px",color:"#475569"}}>{b.patient?.name||"—"}</td>
                                  <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:"#16a34a"}}>₹{(b.paidAmount||0).toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
                                  <td style={{padding:"8px 12px",textAlign:"center"}}>
                                    <span style={{padding:"2px 8px",borderRadius:100,fontSize:9,fontWeight:700,background:b.status==="PAID"?"#dcfce7":b.status==="PENDING"?"#fff7ed":"#eff6ff",color:b.status==="PAID"?"#16a34a":b.status==="PENDING"?"#ea580c":"#2563eb"}}>{b.status}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Expenses — Purchases */}
                    <div className="sd2-card">
                      <div className="sd2-card-hd" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span className="sd2-card-title"><AlertTriangle size={14} color="#ef4444"/> Purchase Expenses ({revExpData.expenses?.items?.length||0})</span>
                        {revExpData.expenses?.pendingPayouts>0 && <span style={{fontSize:10,fontWeight:700,color:"#ea580c",background:"#fff7ed",padding:"2px 8px",borderRadius:100}}>₹{revExpData.expenses.pendingPayouts.toLocaleString("en-IN")} due</span>}
                      </div>
                      {(revExpData.expenses?.items||[]).length===0 ? (
                        <div style={{padding:"28px",textAlign:"center",color:"#94a3b8",fontSize:11}}>No purchases yet for this period</div>
                      ) : (
                        <div style={{maxHeight:400,overflowY:"auto"}}>
                          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                            <thead><tr style={{background:"#f8fafc"}}>
                              <th style={{padding:"8px 12px",textAlign:"left",fontWeight:700,color:"#64748b",fontSize:10}}>PO No</th>
                              <th style={{padding:"8px 12px",textAlign:"left",fontWeight:700,color:"#64748b",fontSize:10}}>Supplier</th>
                              <th style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:"#64748b",fontSize:10}}>Amount</th>
                              <th style={{padding:"8px 12px",textAlign:"center",fontWeight:700,color:"#64748b",fontSize:10}}>Payment</th>
                            </tr></thead>
                            <tbody>
                              {(revExpData.expenses?.items||[]).map((p:any,i:number)=>(
                                <tr key={i} style={{borderTop:"1px solid #f1f5f9"}}>
                                  <td style={{padding:"8px 12px",fontWeight:600,color:"#1e293b"}}>{p.purchaseNo}</td>
                                  <td style={{padding:"8px 12px",color:"#475569"}}>{p.supplier?.name||"—"}</td>
                                  <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:"#ef4444"}}>₹{(p.grandTotal||p.totalAmount||0).toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
                                  <td style={{padding:"8px 12px",textAlign:"center"}}>
                                    <span style={{padding:"2px 8px",borderRadius:100,fontSize:9,fontWeight:700,background:p.paymentStatus==="PAID"?"#dcfce7":p.paymentStatus==="PENDING"?"#fff7ed":"#eff6ff",color:p.paymentStatus==="PAID"?"#16a34a":p.paymentStatus==="PENDING"?"#ea580c":"#2563eb"}}>{p.paymentStatus||"—"}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </>)}
              </div>
            )}

            {/* Add Expense Modal */}
            {showAddExpense && (
              <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowAddExpense(false)}>
                <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:440,border:"1px solid #e2e8f0",boxShadow:"0 20px 60px rgba(0,0,0,.18)"}} onClick={e=>e.stopPropagation()}>
                  <div style={{padding:"16px 20px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:14,fontWeight:800,color:"#1e293b",display:"flex",alignItems:"center",gap:8}}><Plus size={16} color={meta.accent}/> Add Expense</span>
                    <button onClick={()=>setShowAddExpense(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={16}/></button>
                  </div>
                  <div style={{padding:"18px 20px",display:"flex",flexDirection:"column",gap:12}}>
                    <div><label style={{fontSize:10,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Title *</label>
                      <input value={expenseForm.title} onChange={e=>setExpenseForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Medical supplies, Utility bill" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:11,outline:"none"}}/>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div><label style={{fontSize:10,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Amount (₹) *</label>
                        <input type="number" value={expenseForm.amount} onChange={e=>setExpenseForm(f=>({...f,amount:e.target.value}))} min="0" step="0.01" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:11,outline:"none"}}/>
                      </div>
                      <div><label style={{fontSize:10,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Date *</label>
                        <input type="date" value={expenseForm.date} onChange={e=>setExpenseForm(f=>({...f,date:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:11,outline:"none"}}/>
                      </div>
                    </div>
                    <div><label style={{fontSize:10,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Category</label>
                      <select value={expenseForm.category} onChange={e=>setExpenseForm(f=>({...f,category:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:11,outline:"none"}}>
                        {["SALARIES","RENT","UTILITIES","SUPPLIES","MAINTENANCE","EQUIPMENT","TRANSPORT","MARKETING","OTHER"].map(c=><option key={c} value={c}>{c.charAt(0)+c.slice(1).toLowerCase()}</option>)}
                      </select>
                    </div>
                    <div><label style={{fontSize:10,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Description</label>
                      <input value={expenseForm.description} onChange={e=>setExpenseForm(f=>({...f,description:e.target.value}))} placeholder="Optional notes" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:11,outline:"none"}}/>
                    </div>
                  </div>
                  <div style={{padding:"12px 20px",borderTop:"1px solid #f1f5f9",display:"flex",justifyContent:"flex-end",gap:8}}>
                    <button onClick={()=>setShowAddExpense(false)} style={{padding:"8px 18px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:11,fontWeight:600,cursor:"pointer"}}>Cancel</button>
                    <button disabled={expenseSaving||!expenseForm.title||!expenseForm.amount||!expenseForm.date} onClick={async()=>{
                      setExpenseSaving(true);
                      const res = await fetch("/api/pharmacy/revenue-expense",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(expenseForm)}).then(r=>r.json());
                      setExpenseSaving(false);
                      if(res.success){setShowAddExpense(false);loadRevExp(revExpPeriod);}
                    }} style={{padding:"8px 20px",borderRadius:8,border:"none",background:expenseSaving?"#94a3b8":meta.accent,color:"#fff",fontSize:11,fontWeight:700,cursor:expenseSaving?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6}}>
                      {expenseSaving?<><Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/>Saving…</>:<><Plus size={13}/>Add Expense</>}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════ FINANCE (fallback placeholder) ═══════════════════ */}
            {["finance"].includes(tab) && (() => {
              const fm: Record<string,{icon:any;color:string;bg:string;title:string;desc:string}> = {
                finance: {icon:<TrendingUp size={28}/>,color:"#6366f1",bg:"#eef2ff",title:"Finance",desc:"Track revenue, expenses and financial reports."},
              };
              const f = fm[tab];
              return (
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:360}}>
                  <div style={{textAlign:"center",maxWidth:360}}>
                    <div style={{width:72,height:72,borderRadius:20,background:f.bg,border:`2px solid ${f.color}22`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",color:f.color}}>{f.icon}</div>
                    <div style={{fontSize:20,fontWeight:800,color:"#1e293b",marginBottom:8}}>{f.title}</div>
                    <div style={{fontSize:13,color:"#64748b",lineHeight:1.6,marginBottom:20}}>{f.desc}</div>
                    <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"8px 18px",borderRadius:100,background:f.bg,border:`1.5px solid ${f.color}44`,color:f.color,fontSize:11,fontWeight:700}}>
                      <Clock size={14}/> Coming Soon
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ═══════════════════ DEPARTMENT INFO (Removed) ═══════════════════ */}


            </>)}
          </div>
        </main>
      </div>

      {/* Modals */}
      {viewingRecord && <ViewRecordModal record={viewingRecord} onClose={() => setViewingRecord(null)} meta={meta} />}
      {editingRecord && <EditRecordModal record={editingRecord} onClose={() => setEditingRecord(null)} onSave={handleEditRecord} meta={meta} />}
      {transferTarget && <TransferPatientModal record={transferTarget} subDepts={subDepts} onClose={() => setTransferTarget(null)} onTransfer={handleTransferPatient} meta={meta} />}
      {viewPrescription && <ViewPrescriptionModal appointment={viewPrescription} onClose={() => setViewPrescription(null)} meta={meta} />}
      {showQuickBook && <BookingWizard onSuccess={() => { setShowQuickBook(false); loadReports(); }} onClose={() => setShowQuickBook(false)} />}

      {/* ── Stock Received Popup ── */}
      {stockNotifs.length > 0 && !stockNotifDismissed && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={dismissStockNotif}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", maxWidth: 520, width: "100%", overflow: "hidden", animation: "hd-slide-up .25s ease" }}>
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg, #065f64, #0E898F)", padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Package size={20} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>Stock Received!</div>
                  <div style={{ fontSize: 11, color: "#a7f3d0", marginTop: 1 }}>
                    {stockNotifs.length === 1 ? "1 transfer" : `${stockNotifs.length} transfers`} from Central Store
                  </div>
                </div>
              </div>
              <button onClick={dismissStockNotif} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, cursor: "pointer", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                <X size={15} />
              </button>
            </div>

            {/* Transfer list */}
            <div style={{ maxHeight: 340, overflowY: "auto", padding: "14px 20px" }}>
              {stockNotifs.map((t: any, ti: number) => {
                const itemCount = t.items?.length || 0;
                const totalQty = (t.items || []).reduce((s: number, i: any) => s + (i.quantity || 0), 0);
                const fmtDate = (d: string) => d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
                return (
                  <div key={t.id} style={{ marginBottom: ti < stockNotifs.length - 1 ? 14 : 0, borderBottom: ti < stockNotifs.length - 1 ? "1px solid #f1f5f9" : "none", paddingBottom: ti < stockNotifs.length - 1 ? 14 : 0 }}>
                    {/* Transfer header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: "#E6F4F4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Truck size={13} color="#0E898F" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 12, color: "#1e293b" }}>{t.transferNo || "Transfer"}</div>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>From: {t.fromLocation?.name || "Central Store"}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: "#64748b" }}>{fmtDate(t.transferredAt)}</div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "#0E898F", marginTop: 1 }}>{itemCount} item{itemCount !== 1 ? "s" : ""} · {totalQty} units</div>
                      </div>
                    </div>
                    {/* Items list */}
                    <div style={{ background: "#f8fafc", borderRadius: 8, overflow: "hidden", border: "1px solid #f1f5f9" }}>
                      {(t.items || []).slice(0, 6).map((itm: any, ii: number) => (
                        <div key={ii} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderBottom: ii < Math.min((t.items?.length || 0), 6) - 1 ? "1px solid #f1f5f9" : "none", background: ii % 2 === 0 ? "#fff" : "#fafffe" }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 11, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{itm.item?.name || "—"}</div>
                            <div style={{ fontSize: 10, color: "#94a3b8" }}>{itm.item?.category} · {itm.item?.unit}</div>
                          </div>
                          <div style={{ flexShrink: 0, fontSize: 12, fontWeight: 800, color: "#065f64", background: "#E6F4F4", borderRadius: 6, padding: "2px 10px", marginLeft: 8 }}>+{itm.quantity}</div>
                        </div>
                      ))}
                      {(t.items?.length || 0) > 6 && (
                        <div style={{ padding: "5px 10px", fontSize: 10, color: "#0E898F", fontWeight: 600, textAlign: "center", background: "#E6F4F4" }}>+{t.items.length - 6} more item{t.items.length - 6 !== 1 ? "s" : ""}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ padding: "12px 20px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 11, color: "#64748b" }}>Your department inventory has been updated.</div>
              <button onClick={dismissStockNotif} style={{ padding: "7px 20px", borderRadius: 8, border: "none", background: "#0E898F", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 size={13} /> Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function SubDeptDashboard() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", color: "#64748b", fontSize:13, gap: 14 }}>
        <Loader2 size={24} style={{ animation: "spin .7s linear infinite" }} />
        Loading dashboard...
      </div>
    }>
      <SubDeptDashboardContent />
    </Suspense>
  );
}
