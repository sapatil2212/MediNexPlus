"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Plus, Users, RefreshCw, Package, X, Pencil,
  AlertTriangle, CheckCircle2, Search, IndianRupee,
  Loader2, ShoppingCart, Trash2,
  ChevronDown, ChevronUp, ChevronsUpDown, Download,
  FileText, FileSpreadsheet, FileType,
  CreditCard, BanknoteIcon, Receipt, Eye, TrendingUp,
  BarChart3, ArrowUpRight, Activity, Bell,
  Edit2, DollarSign, CheckCircle, Check
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Document as DocxDocument, Packer, Paragraph, Table as DocxTable, TableRow as DocxRow, TableCell as DocxCell, WidthType, TextRun, HeadingLevel } from "docx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from "recharts";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  return (await fetch(url, opts)).json();
};

const fmtCur = (n: number) => `₹${(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const fmtDate = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const sortData = (data: any[], sort: {col:string;dir:"asc"|"desc"}) =>
  [...data].sort((a,b) => { const av=a[sort.col]??"",bv=b[sort.col]??""; const c=String(av).localeCompare(String(bv),undefined,{numeric:true}); return sort.dir==="asc"?c:-c; });

const mkTh = (label:string, col:string, sort:{col:string;dir:"asc"|"desc"}, onSort:(c:string)=>void, style?:any) => (
  <th key={col} style={{cursor:"pointer",userSelect:"none",whiteSpace:"nowrap",...style}} onClick={()=>onSort(col)}>
    <div style={{display:"flex",alignItems:"center",gap:4}}>{label}
      {sort.col===col?(sort.dir==="asc"?<ChevronUp size={11}/>:<ChevronDown size={11}/>):<ChevronsUpDown size={11} color="#cbd5e1"/>}
    </div>
  </th>
);

const expBtnStyle:any={display:"flex",alignItems:"center",gap:8,padding:"8px 13px",borderRadius:7,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:12,color:"#334155",fontWeight:500};
const expIconStyle:any={width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0};

function ExportMenu({show,onToggle,onPDF,onExcel,onWord}:{show:boolean;onToggle:()=>void;onPDF:()=>void;onExcel:()=>void;onWord:()=>void}) {
  return (
    <div style={{position:"relative"}}>
      <button onClick={onToggle} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:9,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}><Download size={13}/>Export</button>
      {show&&(<div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.1)",zIndex:50,minWidth:170,padding:6}}>
        <button onClick={onPDF} style={expBtnStyle} onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")} onMouseLeave={e=>(e.currentTarget.style.background="none")}><span style={{...expIconStyle,background:"#fff5f5",color:"#ef4444"}}><FileText size={12}/></span>Export as PDF</button>
        <button onClick={onExcel} style={expBtnStyle} onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")} onMouseLeave={e=>(e.currentTarget.style.background="none")}><span style={{...expIconStyle,background:"#f0fdf4",color:"#16a34a"}}><FileSpreadsheet size={12}/></span>Export as Excel</button>
        <button onClick={onWord} style={expBtnStyle} onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")} onMouseLeave={e=>(e.currentTarget.style.background="none")}><span style={{...expIconStyle,background:"#eff6ff",color:"#2563eb"}}><FileType size={12}/></span>Export as Word</button>
      </div>)}
    </div>
  );
}

async function buildWordDoc(title:string,headers:string[],rows:string[][]):Promise<void> {
  const headerRow=new DocxRow({children:headers.map(h=>new DocxCell({children:[new Paragraph({children:[new TextRun({text:h,bold:true,size:18,font:"Calibri"})]})],width:{size:Math.floor(100/headers.length),type:WidthType.PERCENTAGE},shading:{fill:"0E898F"}}))});
  const dataRows=rows.map(r=>new DocxRow({children:r.map(c=>new DocxCell({children:[new Paragraph({children:[new TextRun({text:c,size:18,font:"Calibri"})]})]}))}));
  const doc=new DocxDocument({sections:[{children:[
    new Paragraph({text:title,heading:HeadingLevel.HEADING_1}),
    new Paragraph({children:[new TextRun({text:`Generated: ${new Date().toLocaleDateString("en-IN")}`,size:18,color:"888888"})]}),
    new Paragraph({text:""}),
    new DocxTable({rows:[headerRow,...dataRows],width:{size:100,type:WidthType.PERCENTAGE}}),
  ]}]});
  const blob=await Packer.toBlob(doc);
  saveAs(blob,`${title.toLowerCase().replace(/\s+/g,"-")}-${new Date().toISOString().slice(0,10)}.docx`);
}

const CATEGORIES = ["Medicine","Consumables","Surgical Items","Equipment","Lab Items"];
const UNITS = ["pcs","strip","box","bottle","vial","ampoule","tube","kg","gm","ml","ltr","pair","set","roll"];
const CHART_COLORS = ["#0E898F","#10b981","#f59e0b","#ef4444","#8b5cf6","#3b82f6","#ec4899","#14b8a6"];

type Tab = "overview" | "items" | "stock" | "suppliers" | "purchases";

const BLANK_ITEM = { name:"", genericName:"", brandName:"", category:"Medicine", subCategory:"", unit:"pcs", supplierName:"", purchasePrice:0, mrp:0, sellingPrice:0, gst:0, minStock:5, openingStock:0, isActive:true, description:"", hsnCode:"", barcode:"" };
const BLANK_SUPP = { name:"", contactPerson:"", phone:"", email:"", gstNumber:"", address:"", city:"", state:"", paymentTerms:"", code:"" };

export default function PharmacyInventoryPanel() {
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Data
  const [items, setItems] = useState<any[]>([]);
  const [stockData, setStockData] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);

  // Modals
  const [itemModal, setItemModal] = useState<{mode:"add"|"edit"|"view"; item:any}|null>(null);
  const [itemForm, setItemForm] = useState<any>({...BLANK_ITEM});
  const [itemSaving, setItemSaving] = useState(false);
  const [itemError, setItemError] = useState("");

  const [suppModal, setSuppModal] = useState<{mode:"add"|"edit"; supplier:any}|null>(null);
  const [suppForm, setSuppForm] = useState<any>({...BLANK_SUPP});
  const [suppSaving, setSuppSaving] = useState(false);
  const [suppError, setSuppError] = useState("");

  const [viewSupplier, setViewSupplier] = useState<any>(null);
  const [stockModal, setStockModal] = useState<{item:any}|null>(null);
  const [stockForm, setStockForm] = useState({quantity:1, price:0, batchNumber:"", expiryDate:""});
  const [stockSaving, setStockSaving] = useState(false);

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [payModal, setPayModal] = useState<any>(null);
  const [payForm, setPayForm] = useState({paymentMethod:"BANK_TRANSFER", amountPaid:0, transactionId:""});
  const [paySaving, setPaySaving] = useState(false);

  const [bulkDelConf, setBulkDelConf] = useState<{table:string;ids:Set<string>}|null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Sort states
  const [itemSort, setItemSort] = useState<{col:string;dir:"asc"|"desc"}>({col:"name",dir:"asc"});
  const [stockSort, setStockSort] = useState<{col:string;dir:"asc"|"desc"}>({col:"name",dir:"asc"});
  const [suppSort, setSuppSort] = useState<{col:string;dir:"asc"|"desc"}>({col:"name",dir:"asc"});
  const [purchSort, setPurchSort] = useState<{col:string;dir:"asc"|"desc"}>({col:"createdAt",dir:"desc"});

  // Multi-select
  const [itemSel, setItemSel] = useState<Set<string>>(new Set());
  const [suppSel, setSuppSel] = useState<Set<string>>(new Set());

  // Export dropdown states
  const [showItemExp, setShowItemExp] = useState(false);
  const [showStockExp, setShowStockExp] = useState(false);
  const [showSuppExp, setShowSuppExp] = useState(false);
  const [showPurchExp, setShowPurchExp] = useState(false);

  // Purchase form state
  const genPONo = () => `PO-${Date.now().toString(36).toUpperCase()}`;
  const genInvNo = () => { const d = new Date(); return `INV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.random().toString(36).slice(2,6).toUpperCase()}`; };

  // Purchase form
  const [purchaseForm, setPurchaseForm] = useState<any>({
    supplierId:"", purchaseNo:"", invoiceNumber:"", invoiceDate:new Date().toISOString().split("T")[0],
    notes:"", paymentType:"CREDIT", paymentMethod:"BANK_TRANSFER",
    amountPaid:0, transactionId:"", dueDate:"", discount:0, taxPercent:0,
  });
  const [poItems, setPoItems] = useState<any[]>([]);
  const [poSearch, setPoSearch] = useState("");
  const [purchaseSaving, setPurchaseSaving] = useState(false);
  const [purchaseFormError, setPurchaseFormError] = useState("");
  const [allInventoryItems, setAllInventoryItems] = useState<any[]>([]);
  const [receivingId, setReceivingId] = useState<string|null>(null);

  // ── Loaders ──────────────────────────────────────────────────────────────
  const loadItems = useCallback(async () => {
    setLoading(true);
    const d = await api("/api/pharmacy/inventory?limit=500");
    if (d.success) setItems(d.data || []);
    setLoading(false);
  }, []);

  const loadStock = useCallback(async () => {
    setLoading(true);
    const d = await api("/api/pharmacy/dept-stock");
    if (d.success) setStockData(d.data?.items || []);
    setLoading(false);
  }, []);

  const loadSuppliers = useCallback(async () => {
    const d = await api("/api/pharmacy/suppliers");
    if (d.success) setSuppliers(d.data || []);
  }, []);

  const loadPurchases = useCallback(async () => {
    setLoading(true);
    try { const d = await api("/api/pharmacy/purchases?limit=100"); if (d.success) setPurchases(d.data?.data || []); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadSuppliers(); }, [loadSuppliers]);
  useEffect(() => {
    if (tab === "overview") {
      setLoading(true);
      Promise.all([
        api("/api/pharmacy/inventory?limit=500").then(d => { if (d.success) setItems(d.data || []); }),
        api("/api/pharmacy/dept-stock").then(d => { if (d.success) setStockData(d.data?.items || []); }),
        api("/api/pharmacy/purchases?limit=100").then(d => { if (d.success) setPurchases(d.data?.data || []); }),
      ]).then(() => setLoading(false));
    } else if (tab === "items") loadItems();
    else if (tab === "stock") loadStock();
    else if (tab === "suppliers") { setLoading(false); loadSuppliers(); }
    else if (tab === "purchases") loadPurchases();
  }, [tab, loadItems, loadStock, loadSuppliers, loadPurchases]);

  // ── Computed ─────────────────────────────────────────────────────────────
  const lowStockItems = items.filter((i: any) => (i.totalStock ?? 0) <= (i.minStock ?? 5) && i.isActive);
  const outOfStockItems = items.filter((i: any) => (i.totalStock ?? 0) === 0 && i.isActive);
  const totalValue = items.reduce((s: number, i: any) => s + ((i.totalStock ?? 0) * (i.purchasePrice ?? 0)), 0);
  const pendingPayments = purchases.filter((p: any) => p.paymentStatus !== "PAID");
  const totalPurchaseValue = purchases.reduce((s: number, p: any) => s + (p.grandTotal || p.totalAmount || 0), 0);
  const filteredItems = search ? items.filter((i: any) => i.name?.toLowerCase().includes(search.toLowerCase()) || i.category?.toLowerCase().includes(search.toLowerCase())) : items;
  const filteredStock = search ? stockData.filter((i: any) => i.name?.toLowerCase().includes(search.toLowerCase()) || i.category?.toLowerCase().includes(search.toLowerCase())) : stockData;
  const filteredSuppliers = search ? suppliers.filter((s: any) => s.name?.toLowerCase().includes(search.toLowerCase()) || s.contactPerson?.toLowerCase().includes(search.toLowerCase())) : suppliers;
  const filteredPurchases = search ? purchases.filter((p: any) => (p.purchaseNo||"").toLowerCase().includes(search.toLowerCase()) || (p.supplier?.name||"").toLowerCase().includes(search.toLowerCase())) : purchases;

  // Chart data
  const categoryData = CATEGORIES.map(c => ({ name: c, count: items.filter((i:any) => i.category === c).length, value: items.filter((i:any) => i.category === c).reduce((s: number, i: any) => s + ((i.totalStock ?? 0) * (i.purchasePrice ?? 0)), 0) })).filter(c => c.count > 0);
  const stockStatusData = [
    { name: "Healthy", value: items.filter((i:any) => (i.totalStock ?? 0) > (i.minStock ?? 5) && i.isActive).length, color: "#10b981" },
    { name: "Low Stock", value: lowStockItems.length, color: "#f59e0b" },
    { name: "Out of Stock", value: outOfStockItems.length, color: "#ef4444" },
    { name: "Inactive", value: items.filter((i:any) => !i.isActive).length, color: "#e2e8f0" },
  ].filter(d => d.value > 0);
  const purchasesByMonth = (() => { const months: any = {}; purchases.forEach((p: any) => { const d = new Date(p.createdAt); const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }); if (!months[key]) months[key] = { key, name: label, amount: 0, count: 0 }; months[key].amount += (p.grandTotal || p.totalAmount || 0); months[key].count += 1; }); return Object.values(months).sort((a: any, b: any) => a.key.localeCompare(b.key)).slice(-6); })();

  // PO computed
  const poSubtotal = poItems.reduce((s: number, p: any) => s + (Number(p.quantity) * Number(p.unitPrice)), 0);
  const poDiscountAmt = purchaseForm.discount || 0;
  const poTaxAmt = ((poSubtotal - poDiscountAmt) * (purchaseForm.taxPercent || 0)) / 100;
  const poGrandTotal = poSubtotal - poDiscountAmt + poTaxAmt;
  const poSearchFiltered = poSearch.length > 1
    ? allInventoryItems.filter((i: any) => i.name.toLowerCase().includes(poSearch.toLowerCase()) && !poItems.find((p: any) => p.itemId === i.id))
    : [];
  const poSelectedSupplier = suppliers.find((s: any) => s.id === purchaseForm.supplierId);

  // Purchase modal handlers
  const openPurchaseModal = async () => {
    setPurchaseForm({ supplierId: "", purchaseNo: genPONo(), invoiceNumber: genInvNo(),
      invoiceDate: new Date().toISOString().split("T")[0],
      notes: "", paymentType: "CREDIT", paymentMethod: "BANK_TRANSFER",
      amountPaid: 0, transactionId: "", dueDate: "", discount: 0, taxPercent: 0,
    });
    setPoItems([]); setPoSearch(""); setPurchaseFormError("");
    setShowPurchaseModal(true);
    if (allInventoryItems.length === 0) {
      const d = await api("/api/pharmacy/inventory");
      if (d.success) setAllInventoryItems(d.data || []);
    }
  };
  const addPoItem = (item: any) => {
    if (poItems.find((p: any) => p.itemId === item.id)) return;
    setPoItems((prev: any[]) => [...prev, {
      itemId: item.id, name: item.name, unit: item.unit || "pcs", category: item.category,
      quantity: 1, unitPrice: item.purchasePrice || 0, batchNumber: "", expiryDate: "",
    }]);
    setPoSearch("");
  };
  const removePoItem = (idx: number) => setPoItems((p: any[]) => p.filter((_: any, i: number) => i !== idx));
  const updatePoItem = (idx: number, field: string, val: any) => setPoItems((p: any[]) => p.map((item: any, i: number) => i === idx ? { ...item, [field]: val } : item));
  const addAllLowStockToPo = () => {
    const newItems = lowStockItems.filter((i: any) => !poItems.find((p: any) => p.itemId === i.id))
      .map((item: any) => ({
        itemId: item.id, name: item.name, unit: item.unit || "pcs", category: item.category,
        quantity: Math.max(1, (item.minStock ?? 5) - (item.totalStock ?? 0)),
        unitPrice: item.purchasePrice || 0, batchNumber: "", expiryDate: "",
      }));
    if (newItems.length > 0) setPoItems((prev: any[]) => [...prev, ...newItems]);
  };
  const savePurchase = async () => {
    if (poItems.length === 0) { setPurchaseFormError("items"); return; }
    if (purchaseForm.paymentType === "CREDIT" && !purchaseForm.dueDate) { setPurchaseFormError("dueDate"); return; }
    setPurchaseFormError(""); setPurchaseSaving(true);
    try {
      const res = await api("/api/pharmacy/purchases", "POST", {
        supplierId: purchaseForm.supplierId || undefined,
        purchaseNo: purchaseForm.purchaseNo,
        invoiceNumber: purchaseForm.invoiceNumber || undefined,
        invoiceDate: purchaseForm.invoiceDate || undefined,
        notes: purchaseForm.notes || undefined,
        paymentType: purchaseForm.paymentType,
        paymentMethod: purchaseForm.paymentType === "PAID" ? purchaseForm.paymentMethod : undefined,
        amountPaid: purchaseForm.paymentType === "PAID" ? poGrandTotal : 0,
        transactionId: purchaseForm.paymentType === "PAID" ? (purchaseForm.transactionId || undefined) : undefined,
        dueDate: purchaseForm.paymentType === "CREDIT" ? purchaseForm.dueDate : undefined,
        discount: poDiscountAmt, taxPercent: purchaseForm.taxPercent || 0, grandTotal: poGrandTotal,
        items: poItems.map((p: any) => ({
          itemId: p.itemId, quantity: parseInt(String(p.quantity)) || 1,
          price: parseFloat(String(p.unitPrice)) || 0,
          batchNumber: p.batchNumber || undefined, expiryDate: p.expiryDate || undefined,
        })),
      });
      if (res.success) { setShowPurchaseModal(false); loadPurchases(); loadItems(); }
      else setPurchaseFormError(res.message || "Failed to create purchase order");
    } catch (err: any) { setPurchaseFormError(err.message || "Failed"); }
    setPurchaseSaving(false);
  };

  // ── CRUD Handlers ─────────────────────────────────────────────────────────
  const saveItem = async () => {
    if (!itemForm.name?.trim()) { setItemError("Name is required"); return; }
    setItemError(""); setItemSaving(true);
    const isEdit = itemModal?.mode === "edit";
    const body = isEdit ? { id: itemModal!.item.id, ...itemForm } : itemForm;
    const d = await api("/api/pharmacy/inventory", isEdit ? "PUT" : "POST", body);
    if (d.success) { setItemModal(null); loadItems(); }
    else setItemError(d.message || "Failed to save item");
    setItemSaving(false);
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Mark this item as inactive?")) return;
    const d = await api(`/api/pharmacy/inventory?id=${id}`, "DELETE");
    if (d.success) loadItems(); else alert(d.message || "Failed");
  };

  const saveSupplier = async () => {
    if (!suppForm.name?.trim()) { setSuppError("Name is required"); return; }
    setSuppError(""); setSuppSaving(true);
    const isEdit = suppModal?.mode === "edit";
    const body = isEdit ? { id: suppModal!.supplier.id, ...suppForm } : suppForm;
    const d = await api("/api/pharmacy/suppliers", isEdit ? "PUT" : "POST", body);
    if (d.success) { setSuppModal(null); loadSuppliers(); }
    else setSuppError(d.message || "Failed to save supplier");
    setSuppSaving(false);
  };

  const deleteSupplier = async (id: string) => {
    if (!confirm("Remove this supplier?")) return;
    const d = await api(`/api/pharmacy/suppliers?id=${id}`, "DELETE");
    if (d.success) loadSuppliers(); else alert(d.message || "Failed");
  };

  const handleBulkDelete = async () => {
    if (!bulkDelConf) return;
    setBulkDeleting(true);
    const ids = Array.from(bulkDelConf.ids);
    if (bulkDelConf.table === "items") {
      for (const id of ids) await api(`/api/pharmacy/inventory?id=${id}`, "DELETE");
      setItemSel(new Set()); loadItems();
    } else {
      for (const id of ids) await api(`/api/pharmacy/suppliers?id=${id}`, "DELETE");
      setSuppSel(new Set()); loadSuppliers();
    }
    setBulkDelConf(null); setBulkDeleting(false);
  };

  const saveStock = async () => {
    if (!stockModal) return;
    if (!stockForm.quantity || stockForm.quantity < 1) return;
    setStockSaving(true);
    const d = await api("/api/pharmacy/stock", "POST", {
      itemId: stockModal.item.id || stockModal.item.itemId,
      quantity: parseInt(String(stockForm.quantity)),
      purchasePrice: parseFloat(String(stockForm.price)) || stockModal.item.purchasePrice || 0,
      batchNumber: stockForm.batchNumber || undefined,
      expiryDate: stockForm.expiryDate || undefined,
    });
    if (d.success) { setStockModal(null); setStockForm({quantity:1,price:0,batchNumber:"",expiryDate:""}); loadItems(); loadStock(); }
    else alert(d.message || "Failed to add stock");
    setStockSaving(false);
  };

  const recordPayment = async () => {
    if (!payModal) return; setPaySaving(true);
    const d = await api("/api/pharmacy/purchases", "PATCH", {
      id: payModal.id, action: "pay",
      paymentMethod: payForm.paymentMethod,
      amountPaid: parseFloat(String(payForm.amountPaid)) || (payModal.grandTotal || payModal.totalAmount),
      transactionId: payForm.transactionId || undefined,
    });
    if (d.success) { setPayModal(null); setPayForm({paymentMethod:"BANK_TRANSFER",amountPaid:0,transactionId:""}); loadPurchases(); }
    else alert(d.message || "Failed");
    setPaySaving(false);
  };

  // ── Sort / select helpers ──────────────────────────────────────────────────
  const onItemSort = (col: string) => setItemSort(p => ({ col, dir: p.col === col && p.dir === "asc" ? "desc" : "asc" }));
  const onStockSort = (col: string) => setStockSort(p => ({ col, dir: p.col === col && p.dir === "asc" ? "desc" : "asc" }));
  const onSuppSort = (col: string) => setSuppSort(p => ({ col, dir: p.col === col && p.dir === "asc" ? "desc" : "asc" }));
  const onPurchSort = (col: string) => setPurchSort(p => ({ col, dir: p.col === col && p.dir === "asc" ? "desc" : "asc" }));
  const sortedItems = sortData(filteredItems, itemSort);
  const sortedStock = sortData(filteredStock, stockSort);
  const sortedSuppliers = sortData(filteredSuppliers, suppSort);
  const sortedPurchases = sortData(filteredPurchases, purchSort);
  const toggleItem = (id: string) => { const s = new Set(itemSel); s.has(id) ? s.delete(id) : s.add(id); setItemSel(s); };
  const toggleAllItems = () => { if (itemSel.size === sortedItems.length) setItemSel(new Set()); else setItemSel(new Set(sortedItems.map((i:any)=>i.id))); };
  const toggleSupp = (id: string) => { const s = new Set(suppSel); s.has(id) ? s.delete(id) : s.add(id); setSuppSel(s); };
  const toggleAllSupps = () => { if (suppSel.size === sortedSuppliers.length) setSuppSel(new Set()); else setSuppSel(new Set(sortedSuppliers.map((s:any)=>s.id))); };

  // ── Export helpers ────────────────────────────────────────────────────────
  const itemExportData = () => (itemSel.size > 0 ? sortedItems.filter((i:any)=>itemSel.has(i.id)) : sortedItems).map((i:any)=>({ Name:i.name, Generic:i.genericName||"", Category:i.category, Unit:i.unit, "Purchase Price":i.purchasePrice||0, MRP:i.mrp||0, "Min Stock":i.minStock||5, "Total Stock":i.totalStock||0 }));
  const itemPDF = () => { const doc=new jsPDF(); doc.setFontSize(16); doc.text("Pharmacy Inventory Items",14,16); autoTable(doc,{startY:24,head:[["Name","Generic","Category","Unit","Purchase Price","MRP","Stock"]],body:itemExportData().map(r=>[r.Name,r.Generic,r.Category,r.Unit,`₹${r["Purchase Price"]}`,`₹${r.MRP}`,r["Total Stock"]]),styles:{fontSize:8},headStyles:{fillColor:[14,137,143]}}); doc.save(`pharmacy-items-${new Date().toISOString().slice(0,10)}.pdf`); setShowItemExp(false); };
  const itemExcel = () => { const ws=XLSX.utils.json_to_sheet(itemExportData()); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"Items"); XLSX.writeFile(wb,`pharmacy-items-${new Date().toISOString().slice(0,10)}.xlsx`); setShowItemExp(false); };
  const itemWord = async () => { const d=itemExportData(); await buildWordDoc("Pharmacy Inventory Items",["Name","Generic","Category","Unit","Purchase Price","MRP","Stock"],d.map(r=>[r.Name,r.Generic,r.Category,r.Unit,`₹${r["Purchase Price"]}`,`₹${r.MRP}`,String(r["Total Stock"])])); setShowItemExp(false); };
  const suppExportData = () => (suppSel.size > 0 ? sortedSuppliers.filter((s:any)=>suppSel.has(s.id)) : sortedSuppliers).map((s:any)=>({ Name:s.name, Contact:s.contactPerson||"", Phone:s.phone||"", Email:s.email||"", GST:s.gstNumber||"", City:s.city||"", "Payment Terms":s.paymentTerms||"" }));
  const suppPDF = () => { const doc=new jsPDF(); doc.setFontSize(16); doc.text("Pharmacy Suppliers",14,16); autoTable(doc,{startY:24,head:[["Name","Contact","Phone","Email","GST","City"]],body:suppExportData().map(r=>[r.Name,r.Contact,r.Phone,r.Email,r.GST,r.City]),styles:{fontSize:8},headStyles:{fillColor:[14,137,143]}}); doc.save(`pharmacy-suppliers-${new Date().toISOString().slice(0,10)}.pdf`); setShowSuppExp(false); };
  const suppExcel = () => { const ws=XLSX.utils.json_to_sheet(suppExportData()); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"Suppliers"); XLSX.writeFile(wb,`pharmacy-suppliers-${new Date().toISOString().slice(0,10)}.xlsx`); setShowSuppExp(false); };
  const suppWord = async () => { const d=suppExportData(); await buildWordDoc("Pharmacy Suppliers",["Name","Contact","Phone","Email","GST","City"],d.map(r=>[r.Name,r.Contact,r.Phone,r.Email,r.GST,r.City])); setShowSuppExp(false); };
  const purchExportData = () => sortedPurchases.map((p:any)=>({ "PO No":p.purchaseNo, Invoice:p.invoiceNumber||"", Supplier:p.supplier?.name||"", Date:fmtDate(p.createdAt), Items:p._count?.items||0, Amount:p.grandTotal||p.totalAmount||0, Status:p.paymentStatus }));
  const purchPDF = () => { const doc=new jsPDF(); doc.setFontSize(16); doc.text("Pharmacy Purchases",14,16); autoTable(doc,{startY:24,head:[["PO No","Invoice","Supplier","Date","Items","Amount","Status"]],body:purchExportData().map(r=>[r["PO No"],r.Invoice,r.Supplier,r.Date,r.Items,`₹${r.Amount}`,r.Status]),styles:{fontSize:8},headStyles:{fillColor:[14,137,143]}}); doc.save(`pharmacy-purchases-${new Date().toISOString().slice(0,10)}.pdf`); setShowPurchExp(false); };
  const purchExcel = () => { const ws=XLSX.utils.json_to_sheet(purchExportData()); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"Purchases"); XLSX.writeFile(wb,`pharmacy-purchases-${new Date().toISOString().slice(0,10)}.xlsx`); setShowPurchExp(false); };
  const purchWord = async () => { const d=purchExportData(); await buildWordDoc("Pharmacy Purchases",["PO No","Invoice","Supplier","Date","Items","Amount","Status"],d.map(r=>[r["PO No"],r.Invoice,r.Supplier,r.Date,String(r.Items),`₹${r.Amount}`,r.Status])); setShowPurchExp(false); };

  const TABS: { id: Tab; label: string; icon: any; count?: number; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: <Activity size={15} /> },
    { id: "items", label: "Items", icon: <Package size={15} />, count: items.length },
    { id: "stock", label: "Stock", icon: <BarChart3 size={15} />, badge: lowStockItems.length },
    { id: "suppliers", label: "Suppliers", icon: <Users size={15} />, count: suppliers.length },
    { id: "purchases", label: "Purchases", icon: <Receipt size={15} />, badge: pendingPayments.length },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      {/* Sticky Tab Bar */}
      <div style={{ position: "sticky", top: 64, zIndex: 20, background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", gap: 0, padding: "6px 8px", flexShrink: 0 }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => { setTab(t.id as Tab); setSearch(""); }} style={{ padding: "7px 13px", borderRadius: 8, border: "none", background: active ? "#E6F4F4" : "none", color: active ? "#0A6B70" : "#64748b", fontSize: 11.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap", position: "relative", flexShrink: 0 }}>
              {t.icon} {t.label}
              {t.count !== undefined && <span style={{ background: active ? "#B3E0E0" : "#f1f5f9", color: active ? "#065f64" : "#94a3b8", padding: "1px 6px", borderRadius: 20, fontSize: 10, fontWeight: 700, marginLeft: 1 }}>{t.count}</span>}
              {(t.badge ?? 0) > 0 && <span style={{ position: "absolute", top: 2, right: 2, background: "#ef4444", color: "#fff", fontSize: 8, fontWeight: 800, width: 15, height: 15, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{t.badge}</span>}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "20px 20px 20px", flex: 1 }}>
      {loading && <div style={{ textAlign: "center", padding: 40 }}><Loader2 size={24} className="hd-spin" color="#0E898F" /></div>}

      {/* ═══════════ TAB: OVERVIEW ═══════════ */}
      {!loading && tab === "overview" && (<>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total Items", val: items.length, sub: `${items.filter((i:any) => i.isActive).length} active` },
            { label: "Stock Value", val: fmtCur(totalValue), sub: `${items.filter((i:any) => (i.totalStock ?? 0) > 0).length} in stock` },
            { label: "Low Stock", val: lowStockItems.length, sub: lowStockItems.length > 0 ? "Needs reorder" : "All healthy", warn: lowStockItems.length > 0 },
            { label: "Purchases", val: purchases.length, sub: fmtCur(totalPurchaseValue) },
          ].map((c, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "16px 18px", border: `1px solid ${(c as any).warn ? "#fecaca" : "#e2e8f0"}` }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: (c as any).warn ? "#ef4444" : "#1e293b", lineHeight: 1 }}>{c.val}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{c.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: "18px 22px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div><div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Stock Value by Category</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Inventory value distribution</div></div>
              <BarChart3 size={18} color="#94a3b8" />
            </div>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                  <Tooltip formatter={(v: any) => fmtCur(v)} contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>{categoryData.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12 }}>No items yet</div>}
          </div>
          <div style={{ background: "#fff", borderRadius: 10, padding: "18px 22px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Stock Health</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>Item status breakdown</div>
            {stockStatusData.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <ResponsiveContainer width="100%" height={150}>
                  <RePieChart><Pie data={stockStatusData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3}>{stockStatusData.map((d, idx) => <Cell key={idx} fill={d.color} />)}</Pie><Tooltip formatter={(v: any, n: any) => [`${v} items`, n]} contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} /></RePieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 6 }}>
                  {stockStatusData.map((d, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#475569" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />{d.name}: <strong>{d.value}</strong></div>)}
                </div>
              </div>
            ) : <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12 }}>No data</div>}
          </div>
        </div>

        {/* Purchase Trends */}
        <div style={{ background: "#fff", borderRadius: 10, padding: "18px 22px", border: "1px solid #e2e8f0", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div><div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Purchase Trends</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Monthly spend</div></div>
            <TrendingUp size={18} color="#94a3b8" />
          </div>
          {(purchasesByMonth as any[]).length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={purchasesByMonth as any[]}>
                <defs><linearGradient id="purchGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                <Tooltip formatter={(v: any) => fmtCur(v)} contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#purchGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12 }}>No purchase data yet</div>}
        </div>

        {/* Bottom Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {/* Low Stock Alerts */}
          <div style={{ background: "#fff", borderRadius: 10, padding: "18px 22px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}><AlertTriangle size={15} color="#ef4444" /><span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Low Stock Alerts</span></div>
            {lowStockItems.length === 0 ? <div style={{ fontSize: 12, color: "#94a3b8", padding: "12px 0" }}>All items are well-stocked</div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto" }}>
                {lowStockItems.slice(0, 5).map((it: any, i: number) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#fff5f5", borderRadius: 8, border: "1px solid #fecaca" }}>
                    <div><div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{it.name}</div><div style={{ fontSize: 10, color: "#94a3b8" }}>{it.category}</div></div>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 800, color: "#ef4444" }}>{it.totalStock ?? 0}</div><div style={{ fontSize: 9, color: "#94a3b8" }}>min: {it.minStock}</div></div>
                  </div>
                ))}
                {lowStockItems.length > 5 && <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}>+{lowStockItems.length - 5} more</div>}
              </div>
            )}
          </div>
          {/* Quick Actions */}
          <div style={{ background: "#fff", borderRadius: 10, padding: "18px 22px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Quick Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "View Stock", icon: <Package size={14} />, color: "#0E898F", bg: "#E6F4F4", action: () => setTab("stock") },
                { label: "View Suppliers", icon: <Users size={14} />, color: "#3b82f6", bg: "#eff6ff", action: () => setTab("suppliers") },
                { label: "New Purchase", icon: <Plus size={14} />, color: "#10b981", bg: "#f0fdf4", action: () => { setTab("purchases"); setTimeout(openPurchaseModal, 100); } },
                { label: "View Purchases", icon: <Receipt size={14} />, color: "#8b5cf6", bg: "#f5f3ff", action: () => setTab("purchases") },
              ].map((a, i) => (
                <button key={i} onClick={a.action} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", width: "100%", textAlign: "left" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", color: a.color, flexShrink: 0 }}>{a.icon}</div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Payment Summary */}
          <div style={{ background: "#fff", borderRadius: 10, padding: "18px 22px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}><IndianRupee size={15} color="#0E898F" /><span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Payment Summary</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}><span style={{ fontSize: 12, color: "#64748b" }}>Total Purchases</span><span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{fmtCur(totalPurchaseValue)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}><span style={{ fontSize: 12, color: "#64748b" }}>Amount Paid</span><span style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>{fmtCur(purchases.reduce((s: number, p: any) => s + (p.amountPaid || 0), 0))}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}><span style={{ fontSize: 12, color: "#64748b" }}>Pending</span><span style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>{fmtCur(purchases.reduce((s: number, p: any) => s + ((p.grandTotal || p.totalAmount || 0) - (p.amountPaid || 0)), 0))}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}><span style={{ fontSize: 12, color: "#64748b" }}>Fully Paid</span><span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{purchases.filter((p: any) => p.paymentStatus === "PAID").length} / {purchases.length}</span></div>
            </div>
          </div>
        </div>
      </>)}

      {/* ═══════════ TAB: ITEMS ═══════════ */}
      {!loading && tab === "items" && (<>
        {/* Items KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
          {[
            { label: "Total Items", val: items.length, color: "#0E898F" },
            { label: "Active Items", val: items.filter((i:any) => i.isActive).length, color: "#10b981" },
            { label: "Low Stock", val: lowStockItems.length, color: "#ef4444" },
            { label: "Inventory Value", val: fmtCur(totalValue), color: "#8b5cf6" },
          ].map((c, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 8, padding: "12px 14px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: c.color }}>{c.val}</div>
            </div>
          ))}
        </div>
        {/* Items Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
            <Search size={13} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…" style={{ width: "100%", padding: "7px 10px 7px 32px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
            {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}><X size={13} /></button>}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{sortedItems.length} items</div>
          {itemSel.size > 0 && <button onClick={() => setBulkDelConf({table:"items",ids:itemSel})} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, border: "1px solid #fecaca", background: "#fff5f5", color: "#dc2626", fontSize: 11, fontWeight: 600, cursor: "pointer" }}><Trash2 size={12} /> Delete {itemSel.size}</button>}
          <div style={{ flex: 1 }} />
          <button onClick={loadItems} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}><RefreshCw size={13} /></button>
          <ExportMenu show={showItemExp} onToggle={() => setShowItemExp(p => !p)} onPDF={itemPDF} onExcel={itemExcel} onWord={itemWord} />
          <button onClick={() => { setItemForm({...BLANK_ITEM}); setItemError(""); setItemModal({mode:"add",item:null}); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "none", background: "#0E898F", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}><Plus size={13} /> Add Item</button>
        </div>
        {/* Items Table */}
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "10px 8px", width: 36 }}><input type="checkbox" checked={itemSel.size === sortedItems.length && sortedItems.length > 0} onChange={toggleAllItems} /></th>
              {mkTh("Name","name",itemSort,onItemSort,{padding:"10px 12px",textAlign:"left"})}
              {mkTh("Category","category",itemSort,onItemSort,{padding:"10px 12px",textAlign:"left"})}
              {mkTh("Unit","unit",itemSort,onItemSort,{padding:"10px 12px",textAlign:"center"})}
              {mkTh("Purchase Price","purchasePrice",itemSort,onItemSort,{padding:"10px 12px",textAlign:"right"})}
              {mkTh("MRP","mrp",itemSort,onItemSort,{padding:"10px 12px",textAlign:"right"})}
              {mkTh("Stock","totalStock",itemSort,onItemSort,{padding:"10px 12px",textAlign:"center"})}
              {mkTh("Min Stock","minStock",itemSort,onItemSort,{padding:"10px 12px",textAlign:"center"})}
              <th style={{padding:"10px 12px",fontSize:11,fontWeight:700,color:"#64748b",textAlign:"center"}}>Status</th>
              <th style={{padding:"10px 12px",width:80,textAlign:"center",fontSize:11,fontWeight:700,color:"#64748b"}}>Actions</th>
            </tr></thead>
            <tbody>
              {sortedItems.length === 0
                ? <tr><td colSpan={9} style={{textAlign:"center",padding:40,color:"#94a3b8",fontSize:13}}>{search ? "No items match your search." : "No inventory items yet. Add your first item."}</td></tr>
                : sortedItems.map((item: any, idx: number) => {
                  const isLow = (item.totalStock ?? 0) <= (item.minStock ?? 5);
                  const isOut = (item.totalStock ?? 0) === 0;
                  return (
                    <tr key={item.id} style={{borderBottom:"1px solid #f1f5f9",background:itemSel.has(item.id)?"#f0fdf4":idx%2===0?"#fff":"#fafbfc"}}>
                      <td style={{padding:"8px 8px",textAlign:"center"}}><input type="checkbox" checked={itemSel.has(item.id)} onChange={()=>toggleItem(item.id)} /></td>
                      <td style={{padding:"8px 12px"}}>
                        <div style={{fontWeight:600,color:"#1e293b",fontSize:13}}>{item.name}</div>
                        {item.genericName && <div style={{fontSize:10,color:"#94a3b8"}}>{item.genericName}</div>}
                        {item.brandName && <div style={{fontSize:10,color:"#94a3b8"}}>{item.brandName}</div>}
                      </td>
                      <td style={{padding:"8px 12px"}}><span style={{padding:"2px 8px",borderRadius:5,background:"#E6F4F4",color:"#0E898F",fontSize:10,fontWeight:600}}>{item.category}</span></td>
                      <td style={{padding:"8px 12px",textAlign:"center",color:"#64748b",fontSize:12}}>{item.unit}</td>
                      <td style={{padding:"8px 12px",textAlign:"right",fontWeight:600,fontSize:12}}>{fmtCur(item.purchasePrice||0)}</td>
                      <td style={{padding:"8px 12px",textAlign:"right",fontWeight:600,fontSize:12}}>{fmtCur(item.mrp||0)}</td>
                      <td style={{padding:"8px 12px",textAlign:"center"}}>
                        <span style={{fontWeight:700,color:isOut?"#ef4444":isLow?"#f59e0b":"#10b981",fontSize:13}}>{item.totalStock??0}</span>
                        <span style={{fontSize:10,color:"#94a3b8",marginLeft:2}}>{item.unit}</span>
                      </td>
                      <td style={{padding:"8px 12px",textAlign:"center",color:"#64748b",fontSize:12}}>{item.minStock??5}</td>
                      <td style={{padding:"8px 12px",textAlign:"center"}}>
                        <span style={{padding:"2px 8px",borderRadius:5,fontSize:10,fontWeight:600,background:isOut?"#fef2f2":isLow?"#fffbeb":"#f0fdf4",color:isOut?"#ef4444":isLow?"#d97706":"#10b981"}}>
                          {isOut?"Out":isLow?"Low":"OK"}
                        </span>
                      </td>
                      <td style={{padding:"8px 8px",textAlign:"center"}}>
                        <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                          <button onClick={()=>{setItemForm({name:item.name,genericName:item.genericName||"",brandName:item.brandName||"",category:item.category||"Medicine",subCategory:item.subCategory||"",unit:item.unit||"pcs",supplierName:item.supplierName||"",purchasePrice:item.purchasePrice||0,mrp:item.mrp||0,sellingPrice:item.sellingPrice||0,gst:item.gst||0,minStock:item.minStock||5,openingStock:0,isActive:item.isActive!==false,description:item.description||"",hsnCode:item.hsnCode||"",barcode:item.barcode||""}); setItemError(""); setItemModal({mode:"edit",item});}} title="Edit" style={{width:28,height:28,borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b"}}><Edit2 size={12}/></button>
                          <button onClick={()=>deleteItem(item.id)} title="Delete" style={{width:28,height:28,borderRadius:6,border:"1px solid #fecaca",background:"#fff5f5",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#dc2626"}}><Trash2 size={12}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </>)}

      {/* ═══════════ TAB: STOCK ═══════════ */}
      {!loading && tab === "stock" && (<>
        {lowStockItems.length > 0 && (
          <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"12px 18px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
            <AlertTriangle size={16} color="#d97706"/>
            <span style={{fontSize:13,fontWeight:600,color:"#92400e"}}>{lowStockItems.length} item{lowStockItems.length>1?"s":""} running low on stock</span>
            <button onClick={()=>{setTab("purchases" as Tab); setTimeout(openPurchaseModal,100);}} style={{marginLeft:"auto",padding:"5px 14px",borderRadius:7,border:"none",background:"#f59e0b",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>Create Purchase Order</button>
          </div>
        )}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          <div style={{position:"relative",flex:1,maxWidth:320}}>
            <Search size={13} color="#94a3b8" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search stock…" style={{width:"100%",padding:"7px 10px 7px 32px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/>
          </div>
          <ExportMenu show={showStockExp} onToggle={()=>setShowStockExp(p=>!p)} onPDF={()=>{const doc=new jsPDF();doc.text("Pharmacy Stock",14,16);autoTable(doc,{startY:24,head:[["Name","Category","Stock","Min","Status"]],body:sortedStock.map((i:any)=>[i.name,i.category,`${i.totalStock??0} ${i.unit||""}`,i.minStock??5,(i.totalStock??0)<=5?"Low":"OK"]),styles:{fontSize:8},headStyles:{fillColor:[14,137,143]}});doc.save("pharmacy-stock.pdf");setShowStockExp(false);}} onExcel={()=>{const ws=XLSX.utils.json_to_sheet(sortedStock.map((i:any)=>({Name:i.name,Category:i.category,Stock:i.totalStock??0,Unit:i.unit,MinStock:i.minStock??5})));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Stock");XLSX.writeFile(wb,"pharmacy-stock.xlsx");setShowStockExp(false);}} onWord={async()=>{await buildWordDoc("Pharmacy Stock",["Name","Category","Stock","Min"],sortedStock.map((i:any)=>[i.name,i.category,String(i.totalStock??0),String(i.minStock??5)]));setShowStockExp(false);}}/>
          <button onClick={loadStock} style={{padding:"7px 12px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><RefreshCw size={13}/></button>
        </div>
        <div style={{border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
              {mkTh("Name","name",stockSort,onStockSort,{padding:"10px 14px",textAlign:"left"})}
              {mkTh("Category","category",stockSort,onStockSort,{padding:"10px 12px",textAlign:"left"})}
              {mkTh("Total Stock","totalStock",stockSort,onStockSort,{padding:"10px 12px",textAlign:"center"})}
              {mkTh("Min Stock","minStock",stockSort,onStockSort,{padding:"10px 12px",textAlign:"center"})}
              <th style={{padding:"10px 12px",fontSize:11,fontWeight:700,color:"#64748b",textAlign:"center"}}>Status</th>
              <th style={{padding:"10px 12px",fontSize:11,fontWeight:700,color:"#64748b",textAlign:"center"}}>Add Stock</th>
            </tr></thead>
            <tbody>
              {sortedStock.length === 0
                ? <tr><td colSpan={6} style={{textAlign:"center",padding:40,color:"#94a3b8",fontSize:13}}>No stock data. Receive a purchase order to populate stock.</td></tr>
                : sortedStock.map((item: any, idx: number) => {
                  const total = item.totalStock ?? 0;
                  const min = item.minStock ?? 5;
                  const isOut = total === 0; const isLow = total <= min && total > 0;
                  return (
                    <tr key={item.id||item.itemId} style={{borderBottom:"1px solid #f1f5f9",background:idx%2===0?"#fff":"#fafbfc"}}>
                      <td style={{padding:"10px 14px"}}>
                        <div style={{fontWeight:600,color:"#1e293b"}}>{item.name}</div>
                        {item.genericName && <div style={{fontSize:10,color:"#94a3b8"}}>{item.genericName}</div>}
                      </td>
                      <td style={{padding:"10px 12px"}}><span style={{padding:"2px 8px",borderRadius:5,background:"#E6F4F4",color:"#0E898F",fontSize:10,fontWeight:600}}>{item.category}</span></td>
                      <td style={{padding:"10px 12px",textAlign:"center"}}>
                        <span style={{fontWeight:700,color:isOut?"#ef4444":isLow?"#f59e0b":"#10b981",fontSize:14}}>{total}</span>
                        <span style={{fontSize:10,color:"#94a3b8",marginLeft:3}}>{item.unit||"pcs"}</span>
                      </td>
                      <td style={{padding:"10px 12px",textAlign:"center",color:"#64748b"}}>{min}</td>
                      <td style={{padding:"10px 12px",textAlign:"center"}}>
                        <span style={{padding:"2px 10px",borderRadius:5,fontSize:10,fontWeight:600,background:isOut?"#fef2f2":isLow?"#fffbeb":"#f0fdf4",color:isOut?"#ef4444":isLow?"#d97706":"#10b981"}}>
                          {isOut?"Out of Stock":isLow?"Low Stock":"In Stock"}
                        </span>
                      </td>
                      <td style={{padding:"10px 12px",textAlign:"center"}}>
                        <button onClick={()=>{setStockModal({item});setStockForm({quantity:1,price:item.purchasePrice||0,batchNumber:"",expiryDate:""});}} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 12px",borderRadius:7,border:"none",background:"#E6F4F4",color:"#0E898F",fontSize:11,fontWeight:600,cursor:"pointer",margin:"0 auto"}}>
                          <Plus size={12}/> Stock
                        </button>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </>)}

      {/* ═══════════ TAB: SUPPLIERS ═══════════ */}
      {!loading && tab === "suppliers" && (<>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          <div style={{position:"relative",flex:1,maxWidth:320}}>
            <Search size={13} color="#94a3b8" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search suppliers…" style={{width:"100%",padding:"7px 10px 7px 32px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/>
            {search && <button onClick={()=>setSearch("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#94a3b8",padding:0}}><X size={13}/></button>}
          </div>
          <div style={{fontSize:12,color:"#94a3b8",fontWeight:600}}>{sortedSuppliers.length} suppliers</div>
          {suppSel.size > 0 && <button onClick={()=>setBulkDelConf({table:"suppliers",ids:suppSel})} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:8,border:"1px solid #fecaca",background:"#fff5f5",color:"#dc2626",fontSize:11,fontWeight:600,cursor:"pointer"}}><Trash2 size={12}/> Delete {suppSel.size}</button>}
          <div style={{flex:1}}/>
          <button onClick={loadSuppliers} style={{padding:"7px 12px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><RefreshCw size={13}/></button>
          <ExportMenu show={showSuppExp} onToggle={()=>setShowSuppExp(p=>!p)} onPDF={suppPDF} onExcel={suppExcel} onWord={suppWord}/>
          <button onClick={()=>{setSuppForm({...BLANK_SUPP});setSuppError("");setSuppModal({mode:"add",supplier:null});}} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:9,border:"none",background:"#0E898F",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}><Plus size={13}/> Add Supplier</button>
        </div>
        <div style={{border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
              <th style={{padding:"10px 8px",width:36}}><input type="checkbox" checked={suppSel.size===sortedSuppliers.length&&sortedSuppliers.length>0} onChange={toggleAllSupps}/></th>
              {mkTh("Name","name",suppSort,onSuppSort,{padding:"10px 12px",textAlign:"left"})}
              {mkTh("Contact","contactPerson",suppSort,onSuppSort,{padding:"10px 12px",textAlign:"left"})}
              {mkTh("Phone","phone",suppSort,onSuppSort,{padding:"10px 12px",textAlign:"left"})}
              <th style={{padding:"10px 12px",fontSize:11,fontWeight:700,color:"#64748b"}}>GST No.</th>
              <th style={{padding:"10px 12px",fontSize:11,fontWeight:700,color:"#64748b"}}>City</th>
              <th style={{padding:"10px 12px",fontSize:11,fontWeight:700,color:"#64748b",textAlign:"center"}}>Actions</th>
            </tr></thead>
            <tbody>
              {sortedSuppliers.length === 0
                ? <tr><td colSpan={7} style={{textAlign:"center",padding:40,color:"#94a3b8",fontSize:13}}>{search?"No suppliers match your search.":"No suppliers yet."}</td></tr>
                : sortedSuppliers.map((s: any, idx: number) => (
                  <tr key={s.id} style={{borderBottom:"1px solid #f1f5f9",background:suppSel.has(s.id)?"#f0fdf4":idx%2===0?"#fff":"#fafbfc"}}>
                    <td style={{padding:"8px 8px",textAlign:"center"}}><input type="checkbox" checked={suppSel.has(s.id)} onChange={()=>toggleSupp(s.id)}/></td>
                    <td style={{padding:"10px 12px"}}>
                      <div style={{fontWeight:600,color:"#1e293b"}}>{s.name}</div>
                      {s.code && <div style={{fontSize:10,color:"#94a3b8"}}>Code: {s.code}</div>}
                    </td>
                    <td style={{padding:"10px 12px",color:"#475569"}}>{s.contactPerson||"—"}</td>
                    <td style={{padding:"10px 12px",color:"#475569"}}>{s.phone||"—"}</td>
                    <td style={{padding:"10px 12px",color:"#475569",fontSize:11}}>{s.gstNumber||"—"}</td>
                    <td style={{padding:"10px 12px",color:"#475569"}}>{s.city||"—"}</td>
                    <td style={{padding:"8px 8px",textAlign:"center"}}>
                      <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                        <button onClick={()=>setViewSupplier(s)} title="View" style={{width:28,height:28,borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#0E898F"}}><Eye size={12}/></button>
                        <button onClick={()=>{setSuppForm({name:s.name||"",contactPerson:s.contactPerson||"",phone:s.phone||"",email:s.email||"",address:s.address||"",city:s.city||"",state:s.state||"",gstNumber:s.gstNumber||"",paymentTerms:s.paymentTerms||"",code:s.code||""});setSuppError("");setSuppModal({mode:"edit",supplier:s});}} title="Edit" style={{width:28,height:28,borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b"}}><Edit2 size={12}/></button>
                        <button onClick={()=>deleteSupplier(s.id)} title="Delete" style={{width:28,height:28,borderRadius:6,border:"1px solid #fecaca",background:"#fff5f5",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#dc2626"}}><Trash2 size={12}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </>)}

      {/* ═══════════ TAB: PURCHASES ═══════════ */}
      {!loading && tab === "purchases" && (<>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
          {[
            {label:"Total Orders",val:purchases.length,color:"#0E898F"},
            {label:"Total Value",val:fmtCur(totalPurchaseValue),color:"#1e293b"},
            {label:"Pending Payment",val:pendingPayments.length,color:"#f59e0b"},
            {label:"Paid",val:purchases.filter((p:any)=>p.paymentStatus==="PAID").length,color:"#10b981"},
          ].map((c,i)=>(
            <div key={i} style={{background:"#fff",borderRadius:8,padding:"12px 14px",border:"1px solid #e2e8f0"}}>
              <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",marginBottom:4}}>{c.label}</div>
              <div style={{fontSize:18,fontWeight:800,color:c.color}}>{c.val}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          <div style={{position:"relative",flex:1,maxWidth:320}}>
            <Search size={13} color="#94a3b8" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by PO or supplier…" style={{width:"100%",padding:"7px 10px 7px 32px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/>
            {search && <button onClick={()=>setSearch("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#94a3b8",padding:0}}><X size={13}/></button>}
          </div>
          <div style={{flex:1}}/>
          <button onClick={loadPurchases} style={{padding:"7px 12px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><RefreshCw size={13}/></button>
          <ExportMenu show={showPurchExp} onToggle={()=>setShowPurchExp(p=>!p)} onPDF={purchPDF} onExcel={purchExcel} onWord={purchWord}/>
          <button onClick={openPurchaseModal} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:9,border:"none",background:"#0E898F",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}><Plus size={13}/> New Purchase Order</button>
        </div>
        <div style={{border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
              {mkTh("PO No","purchaseNo",purchSort,onPurchSort,{padding:"10px 14px",textAlign:"left"})}
              {mkTh("Supplier","supplier.name",purchSort,onPurchSort,{padding:"10px 12px",textAlign:"left"})}
              {mkTh("Date","createdAt",purchSort,onPurchSort,{padding:"10px 12px",textAlign:"left"})}
              <th style={{padding:"10px 12px",fontSize:11,fontWeight:700,color:"#64748b"}}>Invoice</th>
              {mkTh("Amount","grandTotal",purchSort,onPurchSort,{padding:"10px 12px",textAlign:"right"})}
              <th style={{padding:"10px 12px",fontSize:11,fontWeight:700,color:"#64748b",textAlign:"center"}}>Payment</th>
              <th style={{padding:"10px 12px",fontSize:11,fontWeight:700,color:"#64748b",textAlign:"center"}}>Status</th>
              <th style={{padding:"10px 12px",fontSize:11,fontWeight:700,color:"#64748b",textAlign:"center"}}>Actions</th>
            </tr></thead>
            <tbody>
              {sortedPurchases.length === 0
                ? <tr><td colSpan={8} style={{textAlign:"center",padding:40,color:"#94a3b8",fontSize:13}}>{search?"No purchases match.":"No purchase orders yet."}</td></tr>
                : sortedPurchases.map((p: any, idx: number) => {
                  const amt = p.grandTotal || p.totalAmount || 0;
                  const isPaid = p.paymentStatus === "PAID";
                  const isReceived = p.status === "COMPLETED";
                  return (
                    <tr key={p.id} style={{borderBottom:"1px solid #f1f5f9",background:idx%2===0?"#fff":"#fafbfc"}}>
                      <td style={{padding:"10px 14px"}}>
                        <div style={{fontWeight:700,color:"#0E898F",fontSize:12}}>{p.purchaseNo}</div>
                        {p.dueDate && !isPaid && <div style={{fontSize:10,color:"#f59e0b"}}>Due: {fmtDate(p.dueDate)}</div>}
                      </td>
                      <td style={{padding:"10px 12px",color:"#1e293b",fontWeight:500}}>{p.supplier?.name||<span style={{color:"#94a3b8"}}>N/A</span>}</td>
                      <td style={{padding:"10px 12px",color:"#64748b"}}>{fmtDate(p.createdAt)}</td>
                      <td style={{padding:"10px 12px",color:"#64748b",fontSize:11}}>{p.invoiceNumber||"—"}</td>
                      <td style={{padding:"10px 12px",textAlign:"right",fontWeight:700,color:"#1e293b"}}>{fmtCur(amt)}</td>
                      <td style={{padding:"10px 12px",textAlign:"center"}}>
                        <span style={{padding:"2px 8px",borderRadius:5,fontSize:10,fontWeight:600,background:isPaid?"#f0fdf4":p.paymentStatus==="PARTIAL"?"#fffbeb":"#fef2f2",color:isPaid?"#10b981":p.paymentStatus==="PARTIAL"?"#d97706":"#ef4444"}}>
                          {isPaid?"Paid":p.paymentStatus==="PARTIAL"?"Partial":"Unpaid"}
                        </span>
                      </td>
                      <td style={{padding:"10px 12px",textAlign:"center"}}>
                        <span style={{padding:"2px 8px",borderRadius:5,fontSize:10,fontWeight:600,background:isReceived?"#f0fdf4":"#fef9c3",color:isReceived?"#10b981":"#a16207"}}>
                          {isReceived?"Received":"Pending"}
                        </span>
                      </td>
                      <td style={{padding:"8px 8px",textAlign:"center"}}>
                        <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                          <button onClick={()=>setViewInvoice(p)} title="View" style={{width:28,height:28,borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#0E898F"}}><Eye size={12}/></button>
                          {!isPaid && <button onClick={()=>{setPayModal(p);setPayForm({paymentMethod:"BANK_TRANSFER",amountPaid:amt-(p.amountPaid||0),transactionId:"",});}} title="Record Payment" style={{width:28,height:28,borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#10b981"}}><DollarSign size={12}/></button>}
                          {!isReceived && <button onClick={async()=>{if(!confirm("Mark this purchase as RECEIVED? This will update stock."))return;const r=await api("/api/pharmacy/purchases","PATCH",{id:p.id,status:"COMPLETED"});if(r.success){loadPurchases();loadStock();}else alert(r.message||"Failed");}} disabled={receivingId===p.id} title="Receive" style={{width:28,height:28,borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#8b5cf6"}}><CheckCircle size={12}/></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </>)}

      </div>{/* end content pad */}

    {/* ══════════════ MODALS ══════════════ */}

    {/* ── Item Add/Edit Modal ── */}
    {itemModal && (
      <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget&&!itemSaving)setItemModal(null);}}>
        <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:660,border:"1px solid #e2e8f0",boxShadow:"0 20px 60px rgba(0,0,0,.18)",display:"flex",flexDirection:"column",maxHeight:"90vh"}}>
          <div style={{padding:"18px 24px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <Package size={18} color="#0E898F"/>
              <span style={{fontSize:16,fontWeight:800,color:"#1e293b"}}>{itemModal.mode==="add"?"Add Inventory Item":"Edit Item"}</span>
            </div>
            <button onClick={()=>setItemModal(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={18}/></button>
          </div>
          <div style={{padding:"20px 24px",overflowY:"auto",flex:1}}>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Item Name *</label>
              <input value={itemForm.name} onChange={e=>setItemForm((p:any)=>({...p,name:e.target.value}))} placeholder="e.g. Paracetamol 500mg" autoFocus style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1px solid ${itemError?"#ef4444":"#e2e8f0"}`,fontSize:12,outline:"none"}}/>
              {itemError && <div style={{fontSize:11,color:"#ef4444",marginTop:3}}>⚠ {itemError}</div>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Generic Name</label><input value={itemForm.genericName} onChange={e=>setItemForm((p:any)=>({...p,genericName:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Brand Name</label><input value={itemForm.brandName} onChange={e=>setItemForm((p:any)=>({...p,brandName:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Category *</label>
                <select value={itemForm.category} onChange={e=>setItemForm((p:any)=>({...p,category:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Sub Category</label><input value={itemForm.subCategory} onChange={e=>setItemForm((p:any)=>({...p,subCategory:e.target.value}))} placeholder="Optional" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Unit *</label>
                <select value={itemForm.unit} onChange={e=>setItemForm((p:any)=>({...p,unit:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}>
                  {UNITS.map(u=><option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Preferred Supplier</label>
              <select value={itemForm.supplierName} onChange={e=>setItemForm((p:any)=>({...p,supplierName:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}>
                <option value="">-- Select Supplier --</option>
                {suppliers.map((s:any)=><option key={s.id} value={s.name}>{s.name}{s.city?` (${s.city})`:""}</option>)}
              </select>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:14}}>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Purchase Price (₹)</label><input type="number" value={itemForm.purchasePrice} onChange={e=>setItemForm((p:any)=>({...p,purchasePrice:Number(e.target.value)}))} min="0" step="0.01" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>MRP (₹)</label><input type="number" value={itemForm.mrp} onChange={e=>setItemForm((p:any)=>({...p,mrp:Number(e.target.value)}))} min="0" step="0.01" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Selling Price (₹)</label><input type="number" value={itemForm.sellingPrice} onChange={e=>setItemForm((p:any)=>({...p,sellingPrice:Number(e.target.value)}))} min="0" step="0.01" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>GST %</label><input type="number" value={itemForm.gst} onChange={e=>setItemForm((p:any)=>({...p,gst:Number(e.target.value)}))} min="0" max="28" step="0.5" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Min Stock Level</label><input type="number" value={itemForm.minStock} onChange={e=>setItemForm((p:any)=>({...p,minStock:Number(e.target.value)}))} min="0" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
              {itemModal.mode==="add" && <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Opening Stock</label><input type="number" value={itemForm.openingStock} onChange={e=>setItemForm((p:any)=>({...p,openingStock:Number(e.target.value)}))} min="0" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>}
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>HSN Code</label><input value={itemForm.hsnCode} onChange={e=>setItemForm((p:any)=>({...p,hsnCode:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Description</label>
              <textarea value={itemForm.description} onChange={e=>setItemForm((p:any)=>({...p,description:e.target.value}))} rows={2} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none",resize:"none"}}/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <input type="checkbox" id="itemActive" checked={itemForm.isActive} onChange={e=>setItemForm((p:any)=>({...p,isActive:e.target.checked}))}/>
              <label htmlFor="itemActive" style={{fontSize:12,fontWeight:600,color:"#475569",cursor:"pointer"}}>Active Item</label>
            </div>
          </div>
          <div style={{padding:"12px 24px",borderTop:"1px solid #e2e8f0",display:"flex",justifyContent:"flex-end",gap:8,flexShrink:0}}>
            <button onClick={()=>setItemModal(null)} disabled={itemSaving} style={{padding:"8px 20px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button>
            <button onClick={saveItem} disabled={itemSaving} style={{padding:"8px 24px",borderRadius:8,border:"none",background:"#0E898F",color:"#fff",fontSize:12,fontWeight:700,cursor:itemSaving?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6,opacity:itemSaving?0.7:1}}>
              {itemSaving?<Loader2 size={13} className="hd-spin"/>:<Check size={13}/>}
              {itemSaving?"Saving…":itemModal.mode==="add"?"Add Item":"Save Changes"}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Stock Add Modal ── */}
    {stockModal && (
      <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget&&!stockSaving)setStockModal(null);}}>
        <div style={{background:"#fff",borderRadius:14,width:"100%",maxWidth:480,border:"1px solid #e2e8f0",boxShadow:"0 20px 60px rgba(0,0,0,.18)"}}>
          <div style={{padding:"18px 24px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}><Plus size={18} color="#0E898F"/><span style={{fontSize:16,fontWeight:800,color:"#1e293b"}}>Add Stock — {stockModal.item.name}</span></div>
            <button onClick={()=>setStockModal(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={18}/></button>
          </div>
          <div style={{padding:"20px 24px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Quantity *</label><input type="number" value={stockForm.quantity} onChange={e=>setStockForm(p=>({...p,quantity:Number(e.target.value)}))} min="1" autoFocus style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Purchase Price (₹)</label><input type="number" value={stockForm.price} onChange={e=>setStockForm(p=>({...p,price:Number(e.target.value)}))} min="0" step="0.01" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Batch Number</label><input value={stockForm.batchNumber} onChange={e=>setStockForm(p=>({...p,batchNumber:e.target.value}))} placeholder="Optional" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Expiry Date</label><input type="date" value={stockForm.expiryDate} onChange={e=>setStockForm(p=>({...p,expiryDate:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
            </div>
          </div>
          <div style={{padding:"12px 24px",borderTop:"1px solid #e2e8f0",display:"flex",justifyContent:"flex-end",gap:8}}>
            <button onClick={()=>setStockModal(null)} disabled={stockSaving} style={{padding:"8px 18px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button>
            <button onClick={saveStock} disabled={stockSaving} style={{padding:"8px 22px",borderRadius:8,border:"none",background:"#0E898F",color:"#fff",fontSize:12,fontWeight:700,cursor:stockSaving?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6,opacity:stockSaving?0.7:1}}>
              {stockSaving?<Loader2 size={13} className="hd-spin"/>:<Plus size={13}/>}
              {stockSaving?"Adding…":"Add Stock"}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── View Supplier Modal ── */}
    {viewSupplier && (
      <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)setViewSupplier(null);}}>
        <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:520,border:"1px solid #e2e8f0",boxShadow:"0 20px 60px rgba(0,0,0,.18)"}}>
          <div style={{padding:"18px 24px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}><Users size={18} color="#0E898F"/><span style={{fontSize:16,fontWeight:800,color:"#1e293b"}}>{viewSupplier.name}</span></div>
            <button onClick={()=>setViewSupplier(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={18}/></button>
          </div>
          <div style={{padding:"20px 24px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {[["Contact Person",viewSupplier.contactPerson],["Phone",viewSupplier.phone],["Email",viewSupplier.email],["GST No.",viewSupplier.gstNumber],["City",viewSupplier.city],["State",viewSupplier.state],["Address",viewSupplier.address],["Payment Terms",viewSupplier.paymentTerms]].map(([label,val])=>(
              <div key={label as string}>
                <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",marginBottom:3}}>{label}</div>
                <div style={{fontSize:13,color:"#1e293b",fontWeight:500}}>{val||"—"}</div>
              </div>
            ))}
          </div>
          <div style={{padding:"12px 24px",borderTop:"1px solid #e2e8f0",display:"flex",justifyContent:"flex-end",gap:8}}>
            <button onClick={()=>{setViewSupplier(null);setSuppForm({name:viewSupplier.name||"",contactPerson:viewSupplier.contactPerson||"",phone:viewSupplier.phone||"",email:viewSupplier.email||"",address:viewSupplier.address||"",city:viewSupplier.city||"",state:viewSupplier.state||"",gstNumber:viewSupplier.gstNumber||"",paymentTerms:viewSupplier.paymentTerms||"",code:viewSupplier.code||""});setSuppError("");setSuppModal({mode:"edit",supplier:viewSupplier});}} style={{padding:"8px 18px",borderRadius:8,border:"none",background:"#0E898F",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><Edit2 size={13}/>Edit</button>
            <button onClick={()=>setViewSupplier(null)} style={{padding:"8px 18px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>Close</button>
          </div>
        </div>
      </div>
    )}

    {/* ── Supplier Add/Edit Modal ── */}
    {suppModal && (
      <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget&&!suppSaving)setSuppModal(null);}}>
        <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:580,border:"1px solid #e2e8f0",boxShadow:"0 20px 60px rgba(0,0,0,.18)",display:"flex",flexDirection:"column",maxHeight:"90vh"}}>
          <div style={{padding:"18px 24px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}><Users size={18} color="#0E898F"/><span style={{fontSize:16,fontWeight:800,color:"#1e293b"}}>{suppModal.mode==="add"?"Add Supplier":"Edit Supplier"}</span></div>
            <button onClick={()=>setSuppModal(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={18}/></button>
          </div>
          <div style={{padding:"20px 24px",overflowY:"auto",flex:1}}>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Supplier Name *</label>
              <input value={suppForm.name} onChange={e=>setSuppForm((p:any)=>({...p,name:e.target.value}))} placeholder="Company / Distributor name" autoFocus style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1px solid ${suppError?"#ef4444":"#e2e8f0"}`,fontSize:12,outline:"none"}}/>
              {suppError && <div style={{fontSize:11,color:"#ef4444",marginTop:3}}>⚠ {suppError}</div>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Contact Person</label><input value={suppForm.contactPerson} onChange={e=>setSuppForm((p:any)=>({...p,contactPerson:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Phone</label><input value={suppForm.phone} onChange={e=>setSuppForm((p:any)=>({...p,phone:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Email</label><input type="email" value={suppForm.email} onChange={e=>setSuppForm((p:any)=>({...p,email:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>GST Number</label><input value={suppForm.gstNumber} onChange={e=>setSuppForm((p:any)=>({...p,gstNumber:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>City</label><input value={suppForm.city} onChange={e=>setSuppForm((p:any)=>({...p,city:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>State</label><input value={suppForm.state} onChange={e=>setSuppForm((p:any)=>({...p,state:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Address</label>
              <textarea value={suppForm.address} onChange={e=>setSuppForm((p:any)=>({...p,address:e.target.value}))} rows={2} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none",resize:"none"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Payment Terms</label><input value={suppForm.paymentTerms} onChange={e=>setSuppForm((p:any)=>({...p,paymentTerms:e.target.value}))} placeholder="e.g. 30 days" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Supplier Code</label><input value={suppForm.code} onChange={e=>setSuppForm((p:any)=>({...p,code:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
            </div>
          </div>
          <div style={{padding:"12px 24px",borderTop:"1px solid #e2e8f0",display:"flex",justifyContent:"flex-end",gap:8,flexShrink:0}}>
            <button onClick={()=>setSuppModal(null)} disabled={suppSaving} style={{padding:"8px 20px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button>
            <button onClick={saveSupplier} disabled={suppSaving} style={{padding:"8px 24px",borderRadius:8,border:"none",background:"#0E898F",color:"#fff",fontSize:12,fontWeight:700,cursor:suppSaving?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6,opacity:suppSaving?0.7:1}}>
              {suppSaving?<Loader2 size={13} className="hd-spin"/>:<Check size={13}/>}
              {suppSaving?"Saving…":suppModal.mode==="add"?"Add Supplier":"Save Changes"}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Pay Modal ── */}
    {payModal && (
      <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget&&!paySaving)setPayModal(null);}}>
        <div style={{background:"#fff",borderRadius:14,width:"100%",maxWidth:440,border:"1px solid #e2e8f0",boxShadow:"0 20px 60px rgba(0,0,0,.18)"}}>
          <div style={{padding:"18px 24px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}><DollarSign size={18} color="#10b981"/><span style={{fontSize:16,fontWeight:800,color:"#1e293b"}}>Record Payment</span></div>
            <button onClick={()=>setPayModal(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={18}/></button>
          </div>
          <div style={{padding:"20px 24px"}}>
            <div style={{padding:"12px 16px",background:"#f8fafc",borderRadius:10,marginBottom:16}}>
              <div style={{fontSize:11,color:"#64748b"}}>PO: <strong>{payModal.purchaseNo}</strong></div>
              <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginTop:4}}>Total: {fmtCur(payModal.grandTotal||payModal.totalAmount||0)} | Paid: {fmtCur(payModal.amountPaid||0)} | Due: {fmtCur((payModal.grandTotal||payModal.totalAmount||0)-(payModal.amountPaid||0))}</div>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Payment Method</label>
              <select value={payForm.paymentMethod} onChange={e=>setPayForm(p=>({...p,paymentMethod:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}>
                {["CASH","UPI","CARD","CHEQUE","BANK_TRANSFER","NEFT","RTGS","IMPS"].map(m=><option key={m} value={m}>{m.replace("_"," ")}</option>)}
              </select>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Amount Paid (₹)</label>
              <input type="number" value={payForm.amountPaid} onChange={e=>setPayForm(p=>({...p,amountPaid:Number(e.target.value)}))} min="0" step="0.01" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Transaction ID</label>
              <input value={payForm.transactionId} onChange={e=>setPayForm(p=>({...p,transactionId:e.target.value}))} placeholder="Optional" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/>
            </div>
          </div>
          <div style={{padding:"12px 24px",borderTop:"1px solid #e2e8f0",display:"flex",justifyContent:"flex-end",gap:8}}>
            <button onClick={()=>setPayModal(null)} disabled={paySaving} style={{padding:"8px 18px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button>
            <button onClick={recordPayment} disabled={paySaving} style={{padding:"8px 22px",borderRadius:8,border:"none",background:"#10b981",color:"#fff",fontSize:12,fontWeight:700,cursor:paySaving?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6,opacity:paySaving?0.7:1}}>
              {paySaving?<Loader2 size={13} className="hd-spin"/>:<Check size={13}/>}
              {paySaving?"Saving…":"Record Payment"}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Invoice View Modal ── */}
    {viewInvoice && (
      <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)setViewInvoice(null);}}>
        <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:680,border:"1px solid #e2e8f0",boxShadow:"0 20px 60px rgba(0,0,0,.18)",display:"flex",flexDirection:"column",maxHeight:"90vh"}}>
          <div style={{padding:"18px 24px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}><Receipt size={18} color="#0E898F"/><span style={{fontSize:16,fontWeight:800,color:"#1e293b"}}>Purchase Order — {viewInvoice.purchaseNo}</span></div>
            <button onClick={()=>setViewInvoice(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={18}/></button>
          </div>
          <div style={{padding:"20px 24px",overflowY:"auto",flex:1}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:20}}>
              {[["Supplier",viewInvoice.supplier?.name||"N/A"],["Invoice No.",viewInvoice.invoiceNumber||"—"],["Invoice Date",viewInvoice.invoiceDate?fmtDate(viewInvoice.invoiceDate):"—"],["Order Date",fmtDate(viewInvoice.createdAt)],["Payment",viewInvoice.paymentStatus],["Status",viewInvoice.status]].map(([l,v])=>(
                <div key={l as string}><div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",marginBottom:3}}>{l}</div><div style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{v}</div></div>
              ))}
            </div>
            {viewInvoice.items && viewInvoice.items.length > 0 && (
              <div style={{border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden",marginBottom:16}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead><tr style={{background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
                    <th style={{padding:"8px 12px",textAlign:"left",fontSize:11,fontWeight:700,color:"#64748b"}}>Item</th>
                    <th style={{padding:"8px 12px",textAlign:"center",fontSize:11,fontWeight:700,color:"#64748b"}}>Qty</th>
                    <th style={{padding:"8px 12px",textAlign:"right",fontSize:11,fontWeight:700,color:"#64748b"}}>Unit Price</th>
                    <th style={{padding:"8px 12px",textAlign:"right",fontSize:11,fontWeight:700,color:"#64748b"}}>Total</th>
                  </tr></thead>
                  <tbody>
                    {viewInvoice.items.map((it:any,i:number)=>(
                      <tr key={i} style={{borderBottom:"1px solid #f1f5f9"}}>
                        <td style={{padding:"8px 12px"}}>{it.item?.name||it.name||"—"}</td>
                        <td style={{padding:"8px 12px",textAlign:"center"}}>{it.quantity}</td>
                        <td style={{padding:"8px 12px",textAlign:"right"}}>{fmtCur(it.price||0)}</td>
                        <td style={{padding:"8px 12px",textAlign:"right",fontWeight:600}}>{fmtCur((it.quantity||0)*(it.price||0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"flex-end"}}>
              <div style={{width:220}}>
                {viewInvoice.discount>0 && <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12,color:"#64748b"}}><span>Discount</span><span>-{fmtCur(viewInvoice.discount)}</span></div>}
                {viewInvoice.taxPercent>0 && <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12,color:"#64748b"}}><span>Tax ({viewInvoice.taxPercent}%)</span><span>{fmtCur((viewInvoice.totalAmount-viewInvoice.discount)*(viewInvoice.taxPercent/100))}</span></div>}
                <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderTop:"2px solid #1e293b",fontSize:14,fontWeight:800,color:"#1e293b",marginTop:4}}><span>Grand Total</span><span>{fmtCur(viewInvoice.grandTotal||viewInvoice.totalAmount||0)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12,color:"#10b981"}}><span>Amount Paid</span><span>{fmtCur(viewInvoice.amountPaid||0)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12,fontWeight:700,color:"#ef4444"}}><span>Balance Due</span><span>{fmtCur(Math.max(0,(viewInvoice.grandTotal||viewInvoice.totalAmount||0)-(viewInvoice.amountPaid||0)))}</span></div>
              </div>
            </div>
            {viewInvoice.notes && <div style={{marginTop:14,padding:"12px 16px",background:"#f8fafc",borderRadius:8,fontSize:12,color:"#475569"}}><strong>Notes: </strong>{viewInvoice.notes}</div>}
          </div>
          <div style={{padding:"12px 24px",borderTop:"1px solid #e2e8f0",display:"flex",justifyContent:"flex-end",gap:8,flexShrink:0}}>
            {viewInvoice.paymentStatus!=="PAID" && <button onClick={()=>{setViewInvoice(null);setPayModal(viewInvoice);setPayForm({paymentMethod:"BANK_TRANSFER",amountPaid:(viewInvoice.grandTotal||viewInvoice.totalAmount||0)-(viewInvoice.amountPaid||0),transactionId:""});}} style={{padding:"8px 16px",borderRadius:8,border:"none",background:"#10b981",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><DollarSign size={13}/>Record Payment</button>}
            <button onClick={()=>setViewInvoice(null)} style={{padding:"8px 18px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>Close</button>
          </div>
        </div>
      </div>
    )}

    {/* ── Purchase Order Modal ── */}
    {showPurchaseModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget&&!purchaseSaving)setShowPurchaseModal(false);}}>
          <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:820,border:"1px solid #e2e8f0",boxShadow:"0 20px 60px rgba(0,0,0,.18)",display:"flex",flexDirection:"column",maxHeight:"92vh"}}>
            <div style={{padding:"18px 24px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}><Plus size={18} color="#0E898F"/><span style={{fontSize:16,fontWeight:800,color:"#1e293b"}}>New Purchase Order</span><span style={{padding:"2px 10px",borderRadius:8,background:"#E6F4F4",color:"#0E898F",fontSize:11,fontWeight:700}}>{purchaseForm.purchaseNo}</span></div>
              <button onClick={()=>setShowPurchaseModal(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={18}/></button>
            </div>
            <div style={{padding:"20px 24px",overflowY:"auto",flex:1}}>
              {/* Header */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Supplier</label>
                  <select value={purchaseForm.supplierId} onChange={e=>setPurchaseForm((p:any)=>({...p,supplierId:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}>
                    <option value="">-- Select Supplier --</option>
                    {suppliers.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Invoice Number</label>
                  <input value={purchaseForm.invoiceNumber} onChange={e=>setPurchaseForm((p:any)=>({...p,invoiceNumber:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Invoice Date</label>
                  <input type="date" value={purchaseForm.invoiceDate} onChange={e=>setPurchaseForm((p:any)=>({...p,invoiceDate:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/>
                </div>
              </div>
              {/* Item search */}
              <div style={{marginBottom:12}}>
                <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Add Items *</label>
                <div style={{position:"relative"}}>
                  <Search size={13} color="#94a3b8" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/>
                  <input value={poSearch} onChange={e=>setPoSearch(e.target.value)} placeholder="Search items to add to this order…" style={{width:"100%",padding:"8px 10px 8px 32px",borderRadius:8,border:`1px solid ${purchaseFormError==="items"?"#ef4444":"#e2e8f0"}`,fontSize:12,outline:"none"}}/>
                  {poSearchFiltered.length>0 && (
                    <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,zIndex:50,boxShadow:"0 4px 20px rgba(0,0,0,.1)",maxHeight:200,overflowY:"auto"}}>
                      {poSearchFiltered.map((item:any)=>(
                        <div key={item.id} onClick={()=>{setPoItems((prev:any[])=>[...prev,{itemId:item.id,name:item.name,unit:item.unit||"pcs",category:item.category,quantity:1,unitPrice:item.purchasePrice||0,batchNumber:"",expiryDate:""}]);setPoSearch("");}} style={{padding:"10px 14px",cursor:"pointer",fontSize:12,borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.background="#f8fafc";}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.background="";}} >
                          <div><div style={{fontWeight:600}}>{item.name}</div><div style={{fontSize:10,color:"#94a3b8"}}>{item.category}</div></div>
                          <div style={{fontSize:11,color:"#0E898F",fontWeight:600}}>₹{item.purchasePrice||0}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {purchaseFormError==="items" && <div style={{fontSize:11,color:"#ef4444",marginTop:3}}>⚠ Add at least one item</div>}
              </div>
              {/* Items table */}
              {poItems.length>0 && (
                <div style={{border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden",marginBottom:16}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead><tr style={{background:"#f8fafc"}}>
                      <th style={{padding:"8px 12px",textAlign:"left",fontSize:11,fontWeight:700,color:"#64748b"}}>Item</th>
                      <th style={{padding:"8px 10px",textAlign:"center",fontSize:11,fontWeight:700,color:"#64748b",width:80}}>Qty</th>
                      <th style={{padding:"8px 10px",textAlign:"right",fontSize:11,fontWeight:700,color:"#64748b",width:100}}>Unit Price</th>
                      <th style={{padding:"8px 10px",textAlign:"center",fontSize:11,fontWeight:700,color:"#64748b",width:100}}>Batch No.</th>
                      <th style={{padding:"8px 10px",textAlign:"center",fontSize:11,fontWeight:700,color:"#64748b",width:110}}>Expiry</th>
                      <th style={{width:32}}/>
                    </tr></thead>
                    <tbody>
                      {poItems.map((p:any,i:number)=>(
                        <tr key={i} style={{borderTop:"1px solid #f1f5f9"}}>
                          <td style={{padding:"6px 12px"}}>
                            <div style={{fontWeight:600}}>{p.name}</div>
                            <div style={{fontSize:10,color:"#94a3b8"}}>{p.category} · {p.unit}</div>
                          </td>
                          <td style={{padding:"6px 10px"}}><input type="number" value={p.quantity} onChange={e=>setPoItems((prev:any[])=>prev.map((item:any,j:number)=>j===i?{...item,quantity:Number(e.target.value)}:item))} min="1" style={{width:"100%",padding:"4px 6px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,textAlign:"center"}}/></td>
                          <td style={{padding:"6px 10px"}}><input type="number" value={p.unitPrice} onChange={e=>setPoItems((prev:any[])=>prev.map((item:any,j:number)=>j===i?{...item,unitPrice:Number(e.target.value)}:item))} min="0" step="0.01" style={{width:"100%",padding:"4px 6px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,textAlign:"right"}}/></td>
                          <td style={{padding:"6px 10px"}}><input value={p.batchNumber} onChange={e=>setPoItems((prev:any[])=>prev.map((item:any,j:number)=>j===i?{...item,batchNumber:e.target.value}:item))} placeholder="Optional" style={{width:"100%",padding:"4px 6px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:11,textAlign:"center"}}/></td>
                          <td style={{padding:"6px 10px"}}><input type="date" value={p.expiryDate} onChange={e=>setPoItems((prev:any[])=>prev.map((item:any,j:number)=>j===i?{...item,expiryDate:e.target.value}:item))} style={{width:"100%",padding:"4px 6px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:11}}/></td>
                          <td style={{padding:"6px 8px"}}><button onClick={()=>setPoItems((prev:any[])=>prev.filter((_:any,j:number)=>j!==i))} style={{width:24,height:24,borderRadius:5,border:"none",background:"#fef2f2",color:"#dc2626",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={11}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Totals + payment */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                    <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Discount (₹)</label><input type="number" value={purchaseForm.discount} onChange={e=>setPurchaseForm((p:any)=>({...p,discount:Number(e.target.value)}))} min="0" step="0.01" style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
                    <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Tax %</label><input type="number" value={purchaseForm.taxPercent} onChange={e=>setPurchaseForm((p:any)=>({...p,taxPercent:Number(e.target.value)}))} min="0" max="100" step="0.5" style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
                  </div>
                  <div>
                    <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Payment Type</label>
                    <div style={{display:"flex",gap:8}}>
                      {["PAID","CREDIT"].map(t=>(
                        <button key={t} onClick={()=>setPurchaseForm((p:any)=>({...p,paymentType:t}))} style={{flex:1,padding:"7px 0",borderRadius:8,border:`2px solid ${purchaseForm.paymentType===t?"#0E898F":"#e2e8f0"}`,background:purchaseForm.paymentType===t?"#E6F4F4":"#fff",color:purchaseForm.paymentType===t?"#0E898F":"#64748b",fontSize:12,fontWeight:700,cursor:"pointer"}}>{t}</button>
                      ))}
                    </div>
                  </div>
                  {purchaseForm.paymentType==="CREDIT" && (
                    <div style={{marginTop:10}}>
                      <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Due Date *</label>
                      <input type="date" value={purchaseForm.dueDate} onChange={e=>setPurchaseForm((p:any)=>({...p,dueDate:e.target.value}))} style={{width:"100%",padding:"7px 10px",borderRadius:8,border:`1px solid ${purchaseFormError==="dueDate"?"#ef4444":"#e2e8f0"}`,fontSize:12,outline:"none"}}/>
                      {purchaseFormError==="dueDate" && <div style={{fontSize:11,color:"#ef4444",marginTop:3}}>⚠ Due date required for credit orders</div>}
                    </div>
                  )}
                  {purchaseForm.paymentType==="PAID" && (
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10}}>
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Payment Method</label>
                        <select value={purchaseForm.paymentMethod} onChange={e=>setPurchaseForm((p:any)=>({...p,paymentMethod:e.target.value}))} style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}>
                          {["CASH","UPI","CARD","CHEQUE","BANK_TRANSFER","NEFT","RTGS","IMPS"].map(m=><option key={m} value={m}>{m.replace("_"," ")}</option>)}
                        </select>
                      </div>
                      <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Transaction ID</label><input value={purchaseForm.transactionId} onChange={e=>setPurchaseForm((p:any)=>({...p,transactionId:e.target.value}))} placeholder="Optional" style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/></div>
                    </div>
                  )}
                  <div style={{marginTop:10}}>
                    <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Notes</label>
                    <textarea value={purchaseForm.notes} onChange={e=>setPurchaseForm((p:any)=>({...p,notes:e.target.value}))} rows={2} style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none",resize:"none"}}/>
                  </div>
                </div>
                <div style={{background:"#f8fafc",borderRadius:12,padding:"16px 18px"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:14}}>Order Summary</div>
                  {[["Subtotal",fmtCur(poSubtotal)],["Discount",`-${fmtCur(poDiscountAmt)}`],["Tax",fmtCur(poTaxAmt)]].map(([l,v])=>(
                    <div key={l as string} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #e2e8f0",fontSize:12,color:"#64748b"}}><span>{l}</span><span>{v}</span></div>
                  ))}
                  <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",fontSize:16,fontWeight:800,color:"#1e293b",borderTop:"2px solid #1e293b",marginTop:4}}><span>Grand Total</span><span>{fmtCur(poGrandTotal)}</span></div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:6}}>{poItems.length} item(s) · {purchaseForm.paymentType}</div>
                </div>
              </div>
            </div>
            <div style={{padding:"12px 24px",borderTop:"1px solid #e2e8f0",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
              {purchaseFormError && purchaseFormError!=="items" && purchaseFormError!=="dueDate" && <div style={{fontSize:12,color:"#ef4444"}}>⚠ {purchaseFormError}</div>}
              <div style={{flex:1}}/>
              <button onClick={()=>setShowPurchaseModal(false)} disabled={purchaseSaving} style={{padding:"9px 22px",borderRadius:9,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button>
              <button onClick={savePurchase} disabled={purchaseSaving||poItems.length===0} style={{marginLeft:8,padding:"9px 28px",borderRadius:9,border:"none",background:poItems.length===0?"#94a3b8":"#0E898F",color:"#fff",fontSize:12,fontWeight:700,cursor:purchaseSaving||poItems.length===0?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6,opacity:purchaseSaving?0.7:1}}>
                {purchaseSaving?<Loader2 size={13} className="hd-spin"/>:<Check size={13}/>}
                {purchaseSaving?"Creating…":"Create Purchase Order"}
              </button>
            </div>
          </div>
        </div>
    )}

    {/* ── Bulk Delete Confirm ── */}
    {bulkDelConf && (
      <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{background:"#fff",borderRadius:14,width:"100%",maxWidth:400,border:"1px solid #e2e8f0",boxShadow:"0 20px 60px rgba(0,0,0,.18)",padding:"24px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}><AlertTriangle size={22} color="#ef4444"/><span style={{fontSize:16,fontWeight:800,color:"#1e293b"}}>Confirm Bulk Delete</span></div>
          <p style={{fontSize:13,color:"#475569",marginBottom:20}}>You are about to delete <strong>{bulkDelConf.ids.size} {bulkDelConf.table==="items"?"item(s)":"supplier(s)"}</strong>. This action cannot be undone.</p>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
            <button onClick={()=>setBulkDelConf(null)} disabled={bulkDeleting} style={{padding:"8px 18px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button>
            <button onClick={handleBulkDelete} disabled={bulkDeleting} style={{padding:"8px 22px",borderRadius:8,border:"none",background:"#ef4444",color:"#fff",fontSize:12,fontWeight:700,cursor:bulkDeleting?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6,opacity:bulkDeleting?0.7:1}}>
              {bulkDeleting?<Loader2 size={13} className="hd-spin"/>:<Trash2 size={13}/>}
              {bulkDeleting?"Deleting…":"Delete All"}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}
