"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Search, RefreshCw, Loader2, X, Check, AlertTriangle, Clock,
  BarChart2, Users, ChevronDown, ChevronUp, CheckCircle2, Plus,
  ClipboardList, Calendar, User, Bell, Eye, FileText, Wrench,
  Settings, AlertCircle, IndianRupee, Package, Truck, Activity
} from "lucide-react";

const ACCENT = "#4338ca";
const LIGHT_BG = "#eef2ff";
const BORDER = "#c7d2fe";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: RequestInit = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

export default function BiomedicalDashboard({ profile, user }: { profile: any; user: any }) {
  const [tab, setTab] = useState<"overview" | "equipment" | "maintenance" | "breakdowns" | "logs" | "alerts" | "vendors">("overview");

  // Equipment
  const [equipment, setEquipment] = useState<any[]>([]);
  const [equipLoading, setEquipLoading] = useState(false);
  const [equipSearch, setEquipSearch] = useState("");

  // Maintenance
  const [maintenance, setMaintenance] = useState<any[]>([]);

  // Alerts
  const [alerts, setAlerts] = useState<any[]>([]);

  // Vendors
  const [vendors, setVendors] = useState<any[]>([]);

  const loadEquipment = useCallback(async () => {
    setEquipLoading(true);
    const res = await api(`/api/config/inventory?search=${encodeURIComponent(equipSearch)}&limit=100`);
    if (res.success) setEquipment(res.data?.data || res.data || []);
    setEquipLoading(false);
  }, [equipSearch]);

  const loadVendors = useCallback(async () => {
    const res = await api("/api/inventory/suppliers");
    if (res.success) setVendors(res.data || []);
  }, []);

  useEffect(() => { if (tab === "equipment" || tab === "overview") loadEquipment(); }, [tab, loadEquipment]);
  useEffect(() => { if (tab === "vendors") loadVendors(); }, [tab, loadVendors]);

  return (
    <>
      <style>{bioStyles}</style>

      <div className="bio-nav">
        {([
          { id: "overview", label: "Overview", Icon: BarChart2 },
          { id: "equipment", label: "Equipment", Icon: Package },
          { id: "maintenance", label: "Maintenance", Icon: Wrench },
          { id: "breakdowns", label: "Breakdowns", Icon: AlertCircle },
          { id: "logs", label: "Service Logs", Icon: FileText },
          { id: "alerts", label: "Alerts", Icon: Bell },
          { id: "vendors", label: "Vendors", Icon: Truck },
        ] as const).map(t => (
          <button key={t.id} className={`bio-nav-btn${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)}>
            <t.Icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="bio-section">
          <div className="bio-stats-grid">
            <div className="bio-stat-card">
              <div className="bio-stat-icon" style={{ background: LIGHT_BG }}><Package size={18} color={ACCENT} /></div>
              <div className="bio-stat-info">
                <div className="bio-stat-value">{equipment.length}</div>
                <div className="bio-stat-label">Total Equipment</div>
              </div>
            </div>
            <div className="bio-stat-card">
              <div className="bio-stat-icon" style={{ background: "#f0fdf4" }}><CheckCircle2 size={18} color="#16a34a" /></div>
              <div className="bio-stat-info">
                <div className="bio-stat-value">{equipment.filter(e => e.isActive).length}</div>
                <div className="bio-stat-label">Operational</div>
              </div>
            </div>
            <div className="bio-stat-card">
              <div className="bio-stat-icon" style={{ background: "#fff7ed" }}><Wrench size={18} color="#ea580c" /></div>
              <div className="bio-stat-info">
                <div className="bio-stat-value">{maintenance.length}</div>
                <div className="bio-stat-label">Due Maintenance</div>
              </div>
            </div>
            <div className="bio-stat-card">
              <div className="bio-stat-icon" style={{ background: "#fff5f5" }}><AlertTriangle size={18} color="#ef4444" /></div>
              <div className="bio-stat-info">
                <div className="bio-stat-value">{alerts.length}</div>
                <div className="bio-stat-label">Active Alerts</div>
              </div>
            </div>
          </div>

          <div className="bio-quick-grid">
            <button className="bio-quick-btn" onClick={() => setTab("equipment")}><Package size={20} color={ACCENT} /><span>Equipment Inventory</span></button>
            <button className="bio-quick-btn" onClick={() => setTab("maintenance")}><Wrench size={20} color="#ea580c" /><span>Schedule Maintenance</span></button>
            <button className="bio-quick-btn" onClick={() => setTab("breakdowns")}><AlertCircle size={20} color="#ef4444" /><span>Report Breakdown</span></button>
            <button className="bio-quick-btn" onClick={() => setTab("vendors")}><Truck size={20} color="#16a34a" /><span>Vendor Management</span></button>
          </div>
        </div>
      )}

      {/* Equipment Inventory */}
      {tab === "equipment" && (
        <div className="bio-section">
          <div className="bio-toolbar">
            <div className="bio-toolbar-left">
              <div className="bio-search-wrap">
                <Search size={14} color="#94a3b8" />
                <input className="bio-search-input" placeholder="Search equipment..." value={equipSearch} onChange={e => setEquipSearch(e.target.value)} />
              </div>
            </div>
            <button className="bio-btn-ghost" onClick={loadEquipment}><RefreshCw size={13} /> Refresh</button>
          </div>

          {equipLoading ? (
            <div className="bio-loading"><Loader2 size={20} className="bio-spin" /> Loading equipment...</div>
          ) : equipment.length === 0 ? (
            <div className="bio-empty">
              <Package size={32} color="#cbd5e1" />
              <div style={{ marginTop: 8 }}>No equipment found</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Equipment inventory (MRI, ventilator, etc.) and location tracking</div>
            </div>
          ) : (
            <div className="bio-tbl-wrap">
              <table className="bio-tbl">
                <thead>
                  <tr>
                    <th>Equipment</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.map((e: any) => (
                    <tr key={e.id}>
                      <td><strong>{e.name}</strong>{e.sku && <div style={{ fontSize: 10, color: "#94a3b8" }}>SKU: {e.sku}</div>}</td>
                      <td><span className="bio-badge blue">{e.category || "—"}</span></td>
                      <td>{e.stock ?? 0} {e.unit || ""}</td>
                      <td><span className={`bio-badge ${e.isActive ? "green" : "red"}`}>{e.isActive ? "Active" : "Inactive"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Maintenance Scheduling */}
      {tab === "maintenance" && (
        <div className="bio-section">
          <div className="bio-toolbar">
            <div className="bio-chart-title">Maintenance Scheduling</div>
            <button className="bio-btn-primary"><Plus size={13} /> Schedule Maintenance</button>
          </div>
          <div className="bio-empty">
            <Wrench size={32} color="#cbd5e1" />
            <div style={{ marginTop: 8 }}>Preventive maintenance calendar</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Schedule preventive maintenance, track AMC (Annual Maintenance Contract) details</div>
          </div>
        </div>
      )}

      {/* Breakdowns */}
      {tab === "breakdowns" && (
        <div className="bio-section">
          <div className="bio-toolbar">
            <div className="bio-chart-title">Breakdown Management</div>
            <button className="bio-btn-primary"><Plus size={13} /> Report Issue</button>
          </div>
          <div className="bio-empty">
            <AlertCircle size={32} color="#cbd5e1" />
            <div style={{ marginTop: 8 }}>No active breakdowns</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Report equipment issues and assign technicians for repair</div>
          </div>
        </div>
      )}

      {/* Service Logs */}
      {tab === "logs" && (
        <div className="bio-section">
          <div className="bio-toolbar"><div className="bio-chart-title">Service Logs</div></div>
          <div className="bio-empty">
            <FileText size={32} color="#cbd5e1" />
            <div style={{ marginTop: 8 }}>Repair history and spare parts tracking</div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {tab === "alerts" && (
        <div className="bio-section">
          <div className="bio-toolbar"><div className="bio-chart-title">Equipment Alerts</div></div>
          {alerts.length === 0 ? (
            <div className="bio-empty">
              <Bell size={32} color="#cbd5e1" />
              <div style={{ marginTop: 8 }}>No active alerts</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Maintenance due and equipment failure alerts will appear here</div>
            </div>
          ) : (
            <div className="bio-alert-list">
              {alerts.map((a: any, i: number) => (
                <div key={i} className="bio-alert-item"><AlertTriangle size={16} color="#ef4444" /><span>{a.message}</span></div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vendors */}
      {tab === "vendors" && (
        <div className="bio-section">
          <div className="bio-toolbar">
            <div className="bio-chart-title">Vendor Management</div>
            <button className="bio-btn-ghost" onClick={loadVendors}><RefreshCw size={13} /> Refresh</button>
          </div>
          {vendors.length === 0 ? (
            <div className="bio-empty">
              <Truck size={32} color="#cbd5e1" />
              <div style={{ marginTop: 8 }}>No vendors registered</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Manage supplier and service provider details</div>
            </div>
          ) : (
            <div className="bio-vendor-grid">
              {vendors.map((v: any) => (
                <div key={v.id} className="bio-vendor-card">
                  <div className="bio-vendor-name">{v.name}</div>
                  {v.contactPerson && <div className="bio-vendor-meta"><User size={11} /> {v.contactPerson}</div>}
                  {v.phone && <div className="bio-vendor-meta"><Search size={11} /> {v.phone}</div>}
                  <span className={`bio-badge ${v.isActive ? "green" : "red"}`} style={{ marginTop: 6 }}>{v.isActive ? "Active" : "Inactive"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

const bioStyles = `
  .bio-nav{display:flex;gap:0;padding:6px 0;margin-bottom:20px;border-bottom:2px solid #f1f5f9;flex-wrap:wrap}
  .bio-nav-btn{padding:9px 16px;border:none;background:none;color:#64748b;font-size:12.5px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .15s;white-space:nowrap}
  .bio-nav-btn:hover{color:#334155;background:#f8fafc}
  .bio-nav-btn.on{color:${ACCENT};border-bottom-color:${ACCENT};background:${LIGHT_BG}}
  .bio-section{animation:bioFadeIn .2s ease}
  @keyframes bioFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
  .bio-stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:20px}
  .bio-stat-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;display:flex;align-items:center;gap:14px;transition:all .15s}
  .bio-stat-card:hover{border-color:${BORDER};box-shadow:0 2px 12px rgba(67,56,202,.08)}
  .bio-stat-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .bio-stat-info{min-width:0}
  .bio-stat-value{font-size:22px;font-weight:800;color:#1e293b;line-height:1.2}
  .bio-stat-label{font-size:11px;color:#94a3b8;font-weight:500;margin-top:2px}
  .bio-quick-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
  .bio-quick-btn{display:flex;align-items:center;gap:10px;padding:16px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;cursor:pointer;font-size:13px;font-weight:600;color:#334155;transition:all .15s}
  .bio-quick-btn:hover{border-color:${BORDER};box-shadow:0 2px 12px rgba(67,56,202,.08);transform:translateY(-1px)}
  .bio-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;flex-wrap:wrap}
  .bio-toolbar-left{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .bio-search-wrap{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;width:260px}
  .bio-search-input{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}
  .bio-search-input::placeholder{color:#94a3b8}
  .bio-chart-title{font-size:14px;font-weight:700;color:#1e293b}
  .bio-btn-primary{padding:9px 18px;border-radius:9px;border:none;background:${ACCENT};color:#fff;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .15s;white-space:nowrap}
  .bio-btn-primary:hover{opacity:.9;transform:translateY(-1px)}
  .bio-btn-ghost{padding:8px 14px;border-radius:9px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px}
  .bio-btn-ghost:hover{border-color:#cbd5e1;background:#f8fafc}
  .bio-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700;white-space:nowrap}
  .bio-badge.green{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
  .bio-badge.red{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}
  .bio-badge.blue{background:${LIGHT_BG};color:${ACCENT};border:1px solid ${BORDER}}
  .bio-tbl-wrap{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)}
  .bio-tbl{width:100%;border-collapse:collapse}
  .bio-tbl th{text-align:left;font-size:10px;font-weight:700;color:#94a3b8;padding:12px 14px;border-bottom:2px solid #f1f5f9;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}
  .bio-tbl td{padding:12px 14px;font-size:12px;color:#475569;border-bottom:1px solid #fafbfc}
  .bio-tbl tr:last-child td{border-bottom:none}
  .bio-tbl tbody tr:hover td{background:#fafbfc}
  .bio-vendor-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
  .bio-vendor-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;transition:all .15s}
  .bio-vendor-card:hover{border-color:${BORDER}}
  .bio-vendor-name{font-size:13px;font-weight:700;color:#1e293b;margin-bottom:6px}
  .bio-vendor-meta{font-size:11px;color:#64748b;display:flex;align-items:center;gap:4px;margin-top:3px}
  .bio-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px;color:#94a3b8;font-size:13px}
  .bio-empty{text-align:center;padding:60px 20px;color:#94a3b8;font-size:13px;background:#fff;border-radius:14px;border:1px solid #e2e8f0;display:flex;flex-direction:column;align-items:center}
  .bio-alert-list{display:flex;flex-direction:column;gap:8px}
  .bio-alert-item{display:flex;align-items:center;gap:10px;padding:12px 16px;background:#fff5f5;border:1px solid #fecaca;border-radius:10px;font-size:13px;color:#991b1b}
  @keyframes bioSpin{to{transform:rotate(360deg)}}
  .bio-spin{animation:bioSpin .7s linear infinite}
`;
