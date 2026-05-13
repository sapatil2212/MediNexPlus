"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, X, Check, CheckCheck, Calendar, UserPlus, CreditCard, Activity, Clock, Package, Loader2, QrCode } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  APPOINTMENT_BOOKED:   <Calendar size={14} />,
  APPOINTMENT_UPDATED:  <Calendar size={14} />,
  PATIENT_REGISTERED:   <UserPlus size={14} />,
  BILLING_TRANSFER:     <CreditCard size={14} />,
  PAYMENT_RECEIVED:     <CreditCard size={14} />,
  PROCEDURE_COMPLETED:  <Activity size={14} />,
  FOLLOW_UP_SCHEDULED:  <Clock size={14} />,
  LOW_STOCK:            <Package size={14} />,
  EXPIRING_MEDICINE:    <Clock size={14} />,
  NEW_PRESCRIPTION:     <Activity size={14} />,
  PRESCRIPTION_COMPLETED: <Check size={14} />,
  BOOKING_REQUEST:     <QrCode size={14} />,
  GENERAL:              <Bell size={14} />,
};

const TYPE_COLOR: Record<string, string> = {
  APPOINTMENT_BOOKED:   "#0E898F",
  APPOINTMENT_UPDATED:  "#8b5cf6",
  PATIENT_REGISTERED:   "#10b981",
  BILLING_TRANSFER:     "#f59e0b",
  PAYMENT_RECEIVED:     "#16a34a",
  PROCEDURE_COMPLETED:  "#06b6d4",
  FOLLOW_UP_SCHEDULED:  "#6366f1",
  LOW_STOCK:            "#ef4444",
  EXPIRING_MEDICINE:    "#ea580c",
  NEW_PRESCRIPTION:     "#0E898F",
  PRESCRIPTION_COMPLETED: "#10b981",
  BOOKING_REQUEST:     "#0E898F",
  GENERAL:              "#64748b",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  accentColor?: string;
  bgColor?: string;
  borderColor?: string;
  types?: string[];
}

export default function NotificationBell({
  accentColor  = "#0E898F",
  bgColor      = "#f8fafc",
  borderColor  = "#e2e8f0",
  types,
}: Props) {
  const typesQuery = types && types.length > 0 ? `&types=${types.join(",")}` : "";
  const [open, setOpen]         = useState(false);
  const [unread, setUnread]     = useState(0);
  const [items, setItems]       = useState<Notification[]>([]);
  const [loading, setLoading]   = useState(false);
  const [hasNew, setHasNew]     = useState(false);
  const dropRef                 = useRef<HTMLDivElement>(null);
  const esRef                   = useRef<EventSource | null>(null);
  const prevUnread              = useRef(0);

  // SSE connection for real-time badge
  useEffect(() => {
    const sseUrl = `/api/notifications/stream?t=1${typesQuery}`;
    const es = new EventSource(sseUrl, { withCredentials: true });
    esRef.current = es;

    const onMessage = (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data);
        if (typeof d.unread === "number") {
          if (d.unread > prevUnread.current) setHasNew(true);
          prevUnread.current = d.unread;
          setUnread(d.unread);
        }
      } catch {}
    };

    es.onmessage = onMessage;

    es.onerror = () => {
      es.close();
      // Retry after 10s
      setTimeout(() => {
        const es2 = new EventSource(sseUrl, { withCredentials: true });
        esRef.current = es2;
        es2.onmessage = onMessage;
      }, 10000);
    };

    return () => { es.close(); esRef.current = null; };
  }, [typesQuery]);

  // Fetch notifications list
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/notifications?limit=20${typesQuery}`, { credentials: "include" });
      const d = await r.json();
      if (d.success) {
        setItems(d.data.data || []);
        setUnread(d.data.unread ?? 0);
        prevUnread.current = d.data.unread ?? 0;
      }
    } catch {}
    setLoading(false);
  }, [typesQuery]);

  // Open → fetch list + mark read
  const handleOpen = useCallback(async () => {
    setOpen(true);
    setHasNew(false);
    await fetchItems();
    // Mark all read after a short delay
    setTimeout(async () => {
      await fetch("/api/notifications", { method: "PATCH", credentials: "include" });
      setUnread(0);
      prevUnread.current = 0;
      setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    }, 1500);
  }, [fetchItems]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={dropRef} style={{ position: "relative", display: "inline-flex" }}>
      {/* Bell Button */}
      <button
        onClick={() => (open ? setOpen(false) : handleOpen())}
        style={{
          width: 36, height: 36,
          borderRadius: 10,
          background: open ? accentColor + "18" : bgColor,
          border: `1px solid ${open ? accentColor + "44" : borderColor}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", position: "relative",
          transition: "all .15s",
          outline: "none",
        }}
        title="Notifications"
      >
        <Bell size={16} color={open ? accentColor : "#64748b"} style={{ transition: "transform .2s", transform: hasNew ? "rotate(-15deg)" : "none" }} />
        {unread > 0 && (
          <span style={{
            position: "absolute", top: -5, right: -5,
            minWidth: 18, height: 18,
            background: "#ef4444",
            color: "#fff",
            fontSize: 10, fontWeight: 800,
            borderRadius: 100,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px",
            border: "2px solid #fff",
            boxShadow: "0 2px 6px rgba(239,68,68,.4)",
            animation: hasNew ? "notif-pop .4s ease" : "none",
          }}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 10px)",
          right: 0,
          width: 360,
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 60px rgba(0,0,0,.14)",
          zIndex: 200,
          overflow: "hidden",
          animation: "notif-slide .2s ease",
        }}>
          {/* Header */}
          <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>Notifications</div>
              {unread > 0 && (
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{unread} unread</div>
              )}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {items.some(n => !n.isRead) && (
                <button
                  onClick={async () => {
                    await fetch("/api/notifications", { method: "PATCH", credentials: "include" });
                    setUnread(0); prevUnread.current = 0;
                    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
                  }}
                  title="Mark all read"
                  style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <CheckCheck size={13} color="#64748b" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={13} color="#64748b" />
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {loading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 32, gap: 10, color: "#94a3b8", fontSize: 13 }}>
                <Loader2 size={16} style={{ animation: "spin .7s linear infinite" }} /> Loading...
              </div>
            )}
            {!loading && items.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                <Bell size={32} style={{ opacity: .3, marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
                <div style={{ fontSize: 13, fontWeight: 600 }}>All caught up!</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>No notifications yet</div>
              </div>
            )}
            {!loading && items.map((n, i) => {
              const color = TYPE_COLOR[n.type] || "#64748b";
              const icon  = TYPE_ICON[n.type]  || <Bell size={14} />;
              return (
                <div
                  key={n.id}
                  style={{
                    padding: "12px 16px",
                    borderBottom: i < items.length - 1 ? "1px solid #f8fafc" : "none",
                    background: n.isRead ? "#fff" : `${color}08`,
                    display: "flex", gap: 12, alignItems: "flex-start",
                    cursor: "pointer",
                    transition: "background .15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = n.isRead ? "#fff" : `${color}08`; }}
                  onClick={async () => {
                    if (!n.isRead) {
                      await fetch("/api/notifications", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n.id }) });
                      setItems(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
                      setUnread(c => Math.max(0, c - 1));
                      prevUnread.current = Math.max(0, prevUnread.current - 1);
                    }
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0, marginTop: 1,
                    background: color + "18",
                    border: `1px solid ${color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color,
                  }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: n.isRead ? 500 : 700, color: "#1e293b", lineHeight: 1.3 }}>{n.title}</span>
                      {!n.isRead && (
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 4 }} />
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, lineHeight: 1.5 }}>{n.message}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {items.length > 0 && (
            <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
              <button
                onClick={fetchItems}
                style={{ fontSize: 12, color: accentColor, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes notif-pop{0%{transform:scale(0.5)}60%{transform:scale(1.2)}100%{transform:scale(1)}}
        @keyframes notif-slide{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}
