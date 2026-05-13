"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Search, RefreshCw, Loader2, X, Check, AlertTriangle, Clock,
  BarChart2, Users, ChevronDown, ChevronUp, CheckCircle2, Plus,
  ClipboardList, Calendar, User, Bell, Eye, FileText, MapPin,
  Phone, Activity, Truck, IndianRupee, Navigation, AlertCircle
} from "lucide-react";

const ACCENT = "#b91c1c";
const LIGHT_BG = "#fff5f5";
const BORDER = "#fecaca";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: RequestInit = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const fmtCurrency = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

export default function AmbulanceDashboard({ profile, user }: { profile: any; user: any }) {
  const [tab, setTab] = useState<"overview" | "bookings" | "vehicles" | "drivers" | "trips" | "billing" | "reports">("overview");

  // Bookings
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Vehicles
  const [vehicles, setVehicles] = useState<any[]>([]);

  // Trips
  const [trips, setTrips] = useState<any[]>([]);

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    const res = await api("/api/subdept/queue");
    if (res.success) setBookings(res.data?.queue || []);
    setBookingsLoading(false);
  }, []);

  useEffect(() => { if (tab === "bookings" || tab === "overview") loadBookings(); }, [tab, loadBookings]);

  return (
    <>
      <style>{ambStyles}</style>

      <div className="amb-nav">
        {([
          { id: "overview", label: "Overview", Icon: BarChart2 },
          { id: "bookings", label: "Bookings", Icon: ClipboardList },
          { id: "vehicles", label: "Vehicles", Icon: Truck },
          { id: "drivers", label: "Drivers", Icon: Users },
          { id: "trips", label: "Trip Management", Icon: Navigation },
          { id: "billing", label: "Billing", Icon: IndianRupee },
          { id: "reports", label: "Reports", Icon: FileText },
        ] as const).map(t => (
          <button key={t.id} className={`amb-nav-btn${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)}>
            <t.Icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="amb-section">
          <div className="amb-stats-grid">
            <div className="amb-stat-card">
              <div className="amb-stat-icon" style={{ background: LIGHT_BG }}><ClipboardList size={18} color={ACCENT} /></div>
              <div className="amb-stat-info">
                <div className="amb-stat-value">{bookings.length}</div>
                <div className="amb-stat-label">Today's Bookings</div>
              </div>
            </div>
            <div className="amb-stat-card">
              <div className="amb-stat-icon" style={{ background: "#f0fdf4" }}><Truck size={18} color="#16a34a" /></div>
              <div className="amb-stat-info">
                <div className="amb-stat-value">{vehicles.length}</div>
                <div className="amb-stat-label">Available Vehicles</div>
              </div>
            </div>
            <div className="amb-stat-card">
              <div className="amb-stat-icon" style={{ background: "#fff7ed" }}><Navigation size={18} color="#ea580c" /></div>
              <div className="amb-stat-info">
                <div className="amb-stat-value">{trips.length}</div>
                <div className="amb-stat-label">Active Trips</div>
              </div>
            </div>
            <div className="amb-stat-card">
              <div className="amb-stat-icon" style={{ background: "#eef2ff" }}><IndianRupee size={18} color="#4338ca" /></div>
              <div className="amb-stat-info">
                <div className="amb-stat-value">{fmtCurrency(0)}</div>
                <div className="amb-stat-label">Today's Revenue</div>
              </div>
            </div>
          </div>

          <div className="amb-quick-grid">
            <button className="amb-quick-btn" onClick={() => setTab("bookings")}><ClipboardList size={20} color={ACCENT} /><span>New Booking</span></button>
            <button className="amb-quick-btn" onClick={() => setTab("vehicles")}><Truck size={20} color="#16a34a" /><span>Vehicle Status</span></button>
            <button className="amb-quick-btn" onClick={() => setTab("trips")}><Navigation size={20} color="#ea580c" /><span>Active Trips</span></button>
            <button className="amb-quick-btn" onClick={() => setTab("reports")}><BarChart2 size={20} color="#4338ca" /><span>Trip Reports</span></button>
          </div>
        </div>
      )}

      {/* Bookings */}
      {tab === "bookings" && (
        <div className="amb-section">
          <div className="amb-toolbar">
            <div className="amb-chart-title">Booking Management</div>
            <button className="amb-btn-primary"><Plus size={13} /> New Booking</button>
          </div>
          {bookingsLoading ? (
            <div className="amb-loading"><Loader2 size={20} className="amb-spin" /> Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="amb-empty">
              <ClipboardList size={32} color="#cbd5e1" />
              <div style={{ marginTop: 8 }}>No ambulance bookings</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Emergency and scheduled ambulance requests will appear here</div>
            </div>
          ) : (
            <div className="amb-booking-list">
              {bookings.map((b: any) => (
                <div key={b.id} className="amb-booking-card">
                  <div className="amb-booking-header">
                    <User size={14} color={ACCENT} />
                    <strong>{b.patient?.name || "Unknown"}</strong>
                    <span className="amb-badge orange">{b.type || "Request"}</span>
                  </div>
                  {b.patient?.phone && <div className="amb-booking-meta"><Phone size={11} /> {b.patient.phone}</div>}
                  {b.appointmentDate && <div className="amb-booking-meta"><Calendar size={11} /> {new Date(b.appointmentDate).toLocaleDateString("en-IN")}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vehicles */}
      {tab === "vehicles" && (
        <div className="amb-section">
          <div className="amb-toolbar">
            <div className="amb-chart-title">Vehicle Tracking</div>
            <button className="amb-btn-primary"><Plus size={13} /> Add Vehicle</button>
          </div>
          <div className="amb-empty">
            <Truck size={32} color="#cbd5e1" />
            <div style={{ marginTop: 8 }}>Vehicle fleet management</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Track vehicle status (Available / Busy / Maintenance) and GPS location</div>
          </div>
        </div>
      )}

      {/* Drivers */}
      {tab === "drivers" && (
        <div className="amb-section">
          <div className="amb-toolbar">
            <div className="amb-chart-title">Driver Assignment</div>
            <button className="amb-btn-primary"><Plus size={13} /> Add Driver</button>
          </div>
          <div className="amb-empty">
            <Users size={32} color="#cbd5e1" />
            <div style={{ marginTop: 8 }}>Driver management</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Assign drivers to vehicles, manage contact details and availability</div>
          </div>
        </div>
      )}

      {/* Trips */}
      {tab === "trips" && (
        <div className="amb-section">
          <div className="amb-toolbar"><div className="amb-chart-title">Trip Management</div></div>
          <div className="amb-empty">
            <Navigation size={32} color="#cbd5e1" />
            <div style={{ marginTop: 8 }}>Trip tracking</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Pickup & drop details, distance & time tracking for all ambulance trips</div>
          </div>
        </div>
      )}

      {/* Billing */}
      {tab === "billing" && (
        <div className="amb-section">
          <div className="amb-toolbar"><div className="amb-chart-title">Ambulance Billing</div></div>
          <div className="amb-empty">
            <IndianRupee size={32} color="#cbd5e1" />
            <div style={{ marginTop: 8 }}>Distance-based fare calculation</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Distance-based fare, emergency charges, and billing integration</div>
          </div>
        </div>
      )}

      {/* Reports */}
      {tab === "reports" && (
        <div className="amb-section">
          <div className="amb-toolbar"><div className="amb-chart-title">History & Reports</div></div>
          <div className="amb-empty">
            <FileText size={32} color="#cbd5e1" />
            <div style={{ marginTop: 8 }}>Trip logs and revenue tracking reports</div>
          </div>
        </div>
      )}
    </>
  );
}

const ambStyles = `
  .amb-nav{display:flex;gap:0;padding:6px 0;margin-bottom:20px;border-bottom:2px solid #f1f5f9;flex-wrap:wrap}
  .amb-nav-btn{padding:9px 16px;border:none;background:none;color:#64748b;font-size:12.5px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .15s;white-space:nowrap}
  .amb-nav-btn:hover{color:#334155;background:#f8fafc}
  .amb-nav-btn.on{color:${ACCENT};border-bottom-color:${ACCENT};background:${LIGHT_BG}}
  .amb-section{animation:ambFadeIn .2s ease}
  @keyframes ambFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
  .amb-stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:20px}
  .amb-stat-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;display:flex;align-items:center;gap:14px;transition:all .15s}
  .amb-stat-card:hover{border-color:${BORDER};box-shadow:0 2px 12px rgba(185,28,28,.08)}
  .amb-stat-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .amb-stat-info{min-width:0}
  .amb-stat-value{font-size:22px;font-weight:800;color:#1e293b;line-height:1.2}
  .amb-stat-label{font-size:11px;color:#94a3b8;font-weight:500;margin-top:2px}
  .amb-quick-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
  .amb-quick-btn{display:flex;align-items:center;gap:10px;padding:16px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;cursor:pointer;font-size:13px;font-weight:600;color:#334155;transition:all .15s}
  .amb-quick-btn:hover{border-color:${BORDER};box-shadow:0 2px 12px rgba(185,28,28,.08);transform:translateY(-1px)}
  .amb-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;flex-wrap:wrap}
  .amb-chart-title{font-size:14px;font-weight:700;color:#1e293b}
  .amb-btn-primary{padding:9px 18px;border-radius:9px;border:none;background:${ACCENT};color:#fff;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .15s;white-space:nowrap}
  .amb-btn-primary:hover{opacity:.9;transform:translateY(-1px)}
  .amb-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700;white-space:nowrap}
  .amb-badge.orange{background:#fff7ed;color:#ea580c;border:1px solid #fed7aa}
  .amb-booking-list{display:flex;flex-direction:column;gap:10px}
  .amb-booking-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;transition:all .15s}
  .amb-booking-card:hover{border-color:${BORDER}}
  .amb-booking-header{display:flex;align-items:center;gap:8px;font-size:13px;color:#1e293b;margin-bottom:6px}
  .amb-booking-meta{font-size:11px;color:#64748b;display:flex;align-items:center;gap:5px;margin-top:3px}
  .amb-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px;color:#94a3b8;font-size:13px}
  .amb-empty{text-align:center;padding:60px 20px;color:#94a3b8;font-size:13px;background:#fff;border-radius:14px;border:1px solid #e2e8f0;display:flex;flex-direction:column;align-items:center}
  @keyframes ambSpin{to{transform:rotate(360deg)}}
  .amb-spin{animation:ambSpin .7s linear infinite}
`;
