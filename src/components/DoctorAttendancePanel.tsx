"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Clock, MapPin, LogOut, RefreshCw, Loader2, ChevronLeft, ChevronRight,
  CalendarDays, CheckCircle2, X, Download, ArrowUpDown, ClipboardCheck,
  BarChart2, FileText, FileSpreadsheet, FileType,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from "recharts";

interface Props {
  doctor: any;
  accent?: string;
}

const STATUS_CFG: Record<string, { bg: string; c: string; border: string; label: string }> = {
  PRESENT:  { bg: "#f0fdf4", c: "#16a34a", border: "#bbf7d0", label: "Present"  },
  LATE:     { bg: "#fefce8", c: "#ca8a04", border: "#fde68a", label: "Late"     },
  HALF_DAY: { bg: "#fff7ed", c: "#ea580c", border: "#fed7aa", label: "Half Day" },
  ABSENT:   { bg: "#fff5f5", c: "#dc2626", border: "#fecaca", label: "Absent"   },
};

const fmtTime = (dt: string | null) =>
  dt ? new Date(dt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";

const fmtDateLabel = (dt: string) =>
  new Date(dt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function ExportDropdown({ open, onClose, onExport }: { open: boolean; onClose: () => void; onExport: (f: "pdf" | "excel" | "word") => void }) {
  if (!open) return null;
  return (
    <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.10)", zIndex: 200, minWidth: 160, padding: "6px 0" }}>
      {([["pdf", <FileText size={13} />, "Export PDF"], ["excel", <FileSpreadsheet size={13} />, "Export Excel"], ["word", <FileType size={13} />, "Export Word"]] as any[]).map(([f, icon, label]) => (
        <button key={f} onClick={() => { onExport(f); onClose(); }}
          style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#334155", fontWeight: 500, fontFamily: "inherit" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
          onMouseLeave={e => (e.currentTarget.style.background = "none")}
        >{icon}{label}</button>
      ))}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: -1 }} />
    </div>
  );
}

export function DoctorAttendancePanel({ doctor, accent = "#0E898F" }: Props) {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [exportOpen, setExportOpen] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [posting, setPosting] = useState(true); // true until first POST+GET completes
  const timerRef = useRef<any>(null);
  const hasPostedRef = useRef(false);

  const getLocation = async () => {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch("https://ipapi.co/json/", { signal: ctrl.signal });
      clearTimeout(t);
      const data = await res.json();
      return { location: `${data.city}, ${data.region}, ${data.country_name}`, ip: data.ip };
    } catch {
      return { location: "Unknown Location", ip: "" };
    }
  };

  const fetchAttendance = useCallback(async (m: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/doctor/attendance?month=${m}`, { credentials: "include" });
      const d = await r.json();
      if (d.success) setAttendance(d.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  // POST attendance (idempotent) then GET — guarantees today's record exists before render
  useEffect(() => {
    const loadData = async () => {
      if (!hasPostedRef.current) {
        hasPostedRef.current = true;
        setPosting(true);
        try {
          const loc = await getLocation();
          await fetch("/api/doctor/attendance", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loc),
          });
        } catch { /* ignore – GET will still run */ } finally {
          setPosting(false);
        }
      }
      fetchAttendance(month);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, fetchAttendance]);

  const today = new Date();
  const todayRecord = attendance.find(a => isSameDay(new Date(a.date), today));

  // Live timer for active session
  useEffect(() => {
    if (todayRecord?.loginTime && !todayRecord?.logoutTime) {
      const start = new Date(todayRecord.loginTime).getTime();
      const tick = () => setLiveSeconds(Math.floor((Date.now() - start) / 1000));
      tick();
      timerRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(timerRef.current);
      setLiveSeconds(0);
    }
    return () => clearInterval(timerRef.current);
  }, [todayRecord]);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const loc = await getLocation();
      const r = await fetch("/api/doctor/attendance", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loc),
      }).then(x => x.json());
      if (r.success) fetchAttendance(month);
      else alert(r.message || "Failed to check out");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const fmtLiveDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Stats
  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  let workingDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, monthNum - 1, d).getDay();
    if (dow !== 0 && dow !== 6) workingDays++;
  }
  const presentCount = attendance.filter(a => a.status === "PRESENT").length;
  const lateCount    = attendance.filter(a => a.status === "LATE").length;
  const halfCount    = attendance.filter(a => a.status === "HALF_DAY").length;
  const absentCount  = attendance.filter(a => a.status === "ABSENT").length;
  const attendedDays = presentCount + lateCount + halfCount;
  const attendancePercent = workingDays > 0 ? Math.round((attendedDays / workingDays) * 100) : 0;
  const totalHours = attendance.reduce((s, a) => s + (a.totalWorkHours || 0), 0);
  const avgHours = attendedDays > 0 ? Math.round((totalHours / attendedDays) * 10) / 10 : 0;

  // Chart data — last 14 logged days
  const chartData = [...attendance]
    .filter(a => a.loginTime)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14)
    .map(a => ({
      date: new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      hours: Math.round((a.totalWorkHours || 0) * 10) / 10,
      status: a.status,
    }));

  const barColor = (status: string) => {
    if (status === "PRESENT") return accent;
    if (status === "LATE") return "#ca8a04";
    if (status === "HALF_DAY") return "#ea580c";
    return "#94a3b8";
  };

  // Calendar heatmap
  const firstDow = (new Date(year, monthNum - 1, 1).getDay() + 6) % 7; // Mon-based
  const calCells: ({ day: number; rec: any } | null)[] = [];
  for (let i = 0; i < firstDow; i++) calCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const rec = attendance.find(a => {
      const rd = new Date(a.date);
      return rd.getFullYear() === year && rd.getMonth() === monthNum - 1 && rd.getDate() === d;
    });
    calCells.push({ day: d, rec: rec || null });
  }

  const cellColor = (rec: any, day: number) => {
    const dow = new Date(year, monthNum - 1, day).getDay();
    const isWeekend = dow === 0 || dow === 6;
    if (isWeekend) return { bg: "#f1f5f9", c: "#94a3b8", border: "#e2e8f0" };
    if (!rec) return { bg: "#fff5f5", c: "#dc2626", border: "#fecaca" };
    const sc = STATUS_CFG[rec.status] || STATUS_CFG.PRESENT;
    return { bg: sc.bg, c: sc.c, border: sc.border };
  };

  // Filtered + sorted records
  const filtered = attendance.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    const d = new Date(r.date);
    return fmtDateLabel(r.date).toLowerCase().includes(q)
      || d.toLocaleDateString("en-IN", { weekday: "short" }).toLowerCase().includes(q)
      || (r.status || "").toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "date")      return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sortField === "status")    return dir * (a.status || "").localeCompare(b.status || "");
    if (sortField === "loginTime") return dir * (new Date(a.loginTime || 0).getTime() - new Date(b.loginTime || 0).getTime());
    if (sortField === "hours")     return dir * ((a.totalWorkHours || 0) - (b.totalWorkHours || 0));
    return 0;
  });

  const handleSort = (f: string) => {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("desc"); }
  };

  const sortIcon = (f: string) =>
    sortField === f
      ? <span style={{ color: accent }}>{sortDir === "asc" ? "↑" : "↓"}</span>
      : <ArrowUpDown size={10} color="#cbd5e1" />;

  // Month navigation
  const changeMonth = (delta: number) => {
    const d = new Date(year, monthNum - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  // Export helpers
  const exportHeaders = ["Date", "Day", "Status", "Check-In", "Check-Out", "Location", "Duration (hrs)"];
  const exportRows = sorted.map(r => {
    const d = new Date(r.date);
    return [
      fmtDateLabel(r.date),
      d.toLocaleDateString("en-IN", { weekday: "long" }),
      r.status || "",
      fmtTime(r.loginTime),
      fmtTime(r.logoutTime),
      r.loginLocation || "",
      r.totalWorkHours ? String(r.totalWorkHours) : "—",
    ];
  });

  const doExport = async (fmt: "pdf" | "excel" | "word") => {
    const title = `Attendance — ${month}`;
    if (fmt === "pdf") {
      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(14); doc.text(title, 14, 16);
      doc.setFontSize(9); doc.setTextColor(100);
      doc.text(`Exported: ${new Date().toLocaleString("en-IN")}  |  ${exportRows.length} record(s)`, 14, 24);
      autoTable(doc, { head: [exportHeaders], body: exportRows, startY: 30, styles: { fontSize: 9, cellPadding: 3 }, headStyles: { fillColor: [14, 137, 143], textColor: 255, fontStyle: "bold" }, alternateRowStyles: { fillColor: [248, 250, 252] } });
      doc.save(`attendance-${month}.pdf`);
    } else if (fmt === "excel") {
      const XLSX = (await import("xlsx")).default || await import("xlsx");
      const ws = XLSX.utils.aoa_to_sheet([exportHeaders, ...exportRows]);
      ws["!cols"] = exportHeaders.map(() => ({ wch: 20 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance");
      XLSX.writeFile(wb, `attendance-${month}.xlsx`);
    } else {
      const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun, AlignmentType, BorderStyle } = await import("docx");
      const { saveAs } = await import("file-saver");
      const tb = { top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" } };
      const hRow = new TableRow({ children: exportHeaders.map(h => new TableCell({ borders: tb, shading: { fill: "0E898F" }, children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 18, font: "Calibri" })] })], width: { size: Math.floor(100 / exportHeaders.length), type: WidthType.PERCENTAGE } })) });
      const dataRows = exportRows.map(r => new TableRow({ children: r.map(c => new TableCell({ borders: tb, children: [new Paragraph({ children: [new TextRun({ text: String(c), size: 18, font: "Calibri" })] })] })) }));
      const doc = new Document({ sections: [{ children: [new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 28 })], alignment: AlignmentType.CENTER }), new Table({ rows: [hRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } })] }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `attendance-${month}.docx`);
    }
  };

  const monthLabel = new Date(year, monthNum - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const isCurrentMonth = month === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── TODAY'S STATUS CARD ── */}
      <div style={{ margin: "0 0 20px", borderRadius: 16, overflow: "hidden", border: `1px solid ${accent}33`, boxShadow: `0 2px 12px ${accent}18` }}>
        <div style={{ background: `linear-gradient(135deg, ${accent}, #059669)`, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Clock size={24} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.75)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Today's Session</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                {(posting || (loading && attendance.length === 0))
                  ? <><Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} />Checking status…</>
                  : todayRecord
                    ? (STATUS_CFG[todayRecord.status]?.label || todayRecord.status)
                    : isCurrentMonth ? "Not Checked In" : "—"}
              </div>
              {todayRecord?.loginLocation && (
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.7)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={9} /> {todayRecord.loginLocation}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            {todayRecord?.loginTime && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Check-In</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{fmtTime(todayRecord.loginTime)}</div>
              </div>
            )}
            {todayRecord?.logoutTime ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Check-Out</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{fmtTime(todayRecord.logoutTime)}</div>
              </div>
            ) : todayRecord?.loginTime ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Live Duration</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{fmtLiveDuration(liveSeconds)}</div>
              </div>
            ) : null}
            {todayRecord?.loginTime && !todayRecord?.logoutTime && (
              <button onClick={handleCheckout} disabled={checkoutLoading}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 10, border: "2px solid rgba(255,255,255,.6)", background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: checkoutLoading ? "not-allowed" : "pointer", backdropFilter: "blur(6px)", transition: "all .15s" }}>
                {checkoutLoading ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <LogOut size={14} />}
                {checkoutLoading ? "Checking out…" : "Check Out"}
              </button>
            )}
            {todayRecord?.totalWorkHours ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Total Hours</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{todayRecord.totalWorkHours.toFixed(1)}h</div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── MONTH NAVIGATION + STATS ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => changeMonth(-1)} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}><ChevronLeft size={16} /></button>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", minWidth: 160, textAlign: "center" }}>{monthLabel}</div>
          <button onClick={() => changeMonth(1)} disabled={isCurrentMonth} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid #e2e8f0", background: isCurrentMonth ? "#f1f5f9" : "#f8fafc", cursor: isCurrentMonth ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: isCurrentMonth ? "#cbd5e1" : "#64748b" }}><ChevronRight size={16} /></button>
          <button onClick={() => fetchAttendance(month)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: `1px solid ${accent}33`, background: `${accent}11`, color: accent, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
            <RefreshCw size={11} />Refresh
          </button>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { label: "Attendance", val: `${attendancePercent}%`, bg: "#f0fdf4", c: "#16a34a" },
            { label: "Avg Hours", val: `${avgHours}h`, bg: "#eff6ff", c: "#2563eb" },
            { label: "Present", val: presentCount, bg: "#f0fdf4", c: "#16a34a" },
            { label: "Late", val: lateCount, bg: "#fefce8", c: "#ca8a04" },
            { label: "Half Day", val: halfCount, bg: "#fff7ed", c: "#ea580c" },
            { label: "Working Days", val: workingDays, bg: "#f8fafc", c: "#475569" },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: 10, padding: "8px 14px", textAlign: "center", border: `1px solid ${s.c}22`, minWidth: 64 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: s.c, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: s.c }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CALENDAR HEATMAP + WORK HOURS CHART (side by side) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

        {/* Calendar heatmap */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "16px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}>
            <CalendarDays size={14} color={accent} />Attendance Calendar
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
            {["M","T","W","T","F","S","S"].map((d, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: i >= 5 ? "#94a3b8" : "#64748b", textTransform: "uppercase" }}>{d}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {calCells.map((cell, i) => {
              if (!cell) return <div key={i} />;
              const { day, rec } = cell;
              const dow = new Date(year, monthNum - 1, day).getDay();
              const isWeekend = dow === 0 || dow === 6;
              const isToday2 = isSameDay(new Date(year, monthNum - 1, day), today);
              const colors = cellColor(rec, day);
              return (
                <div key={i} title={rec ? `${STATUS_CFG[rec.status]?.label || rec.status} — ${fmtTime(rec.loginTime)}` : isWeekend ? "Weekend" : "Absent"}
                  style={{ aspectRatio: "1", borderRadius: 6, background: colors.bg, border: isToday2 ? `2px solid ${accent}` : `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: isToday2 ? 800 : 600, color: colors.c, cursor: "default", position: "relative" }}>
                  {day}
                  {isToday2 && <div style={{ position: "absolute", top: 1, right: 2, width: 4, height: 4, borderRadius: "50%", background: accent }} />}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            {[["Present", "#16a34a", "#f0fdf4"], ["Late", "#ca8a04", "#fefce8"], ["Half Day", "#ea580c", "#fff7ed"], ["Absent", "#dc2626", "#fff5f5"], ["Weekend", "#94a3b8", "#f1f5f9"]].map(([label, c, bg]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: bg, border: `1px solid ${c}44` }} />
                <span style={{ fontSize: 9, color: "#64748b", fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Work hours chart */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "16px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 4, display: "flex", alignItems: "center", gap: 7 }}>
            <BarChart2 size={14} color={accent} />Daily Work Hours
            <span style={{ marginLeft: "auto", fontSize: 10, color: "#94a3b8", fontWeight: 500 }}>Last {chartData.length} days</span>
          </div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 12 }}>8h target line</div>
          {chartData.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160, color: "#cbd5e1", fontSize: 12 }}>No data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} barSize={18}>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={24} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}
                  formatter={(v: any) => [`${v}h`, "Work Hours"]}
                />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={barColor(entry.status)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            {[["Present", accent], ["Late", "#ca8a04"], ["Half Day", "#ea580c"]].map(([l, c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
                <span style={{ fontSize: 9, color: "#64748b" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RECORDS TABLE ── */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "7px 12px", flex: 1, minWidth: 180 }}>
            <input
              style={{ background: "none", border: "none", outline: "none", fontSize: 12, color: "#334155", width: "100%", fontFamily: "inherit" }}
              placeholder="Search date, status…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}><X size={12} color="#94a3b8" /></button>}
          </div>
          {loading && <Loader2 size={14} color={accent} style={{ animation: "spin .7s linear infinite" }} />}
          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{sorted.length} of {attendance.length} records</div>
          <div style={{ position: "relative", marginLeft: "auto" }}>
            <button onClick={() => setExportOpen(!exportOpen)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
              <Download size={14} />Export
            </button>
            <ExportDropdown open={exportOpen} onClose={() => setExportOpen(false)} onExport={doExport} />
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "48px 0", color: "#94a3b8" }}>
            <Loader2 size={20} style={{ animation: "spin .7s linear infinite" }} />Loading attendance records…
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8" }}>
            <ClipboardCheck size={36} style={{ marginBottom: 10, opacity: .3, display: "block", margin: "0 auto 10px" }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>
              {search ? "No matching records" : `No attendance records for ${monthLabel}`}
            </div>
            <div style={{ fontSize: 11, marginTop: 4 }}>
              {search ? "Try a different search" : "Records appear automatically on every login"}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  {[
                    { k: "date",      l: "Date"       },
                    { k: "date",      l: "Day"        },
                    { k: "status",    l: "Status"     },
                    { k: "loginTime", l: "Check-In"   },
                    { k: "loginTime", l: "Check-Out"  },
                    { k: "hours",     l: "Duration"   },
                    { k: null,        l: "Location"   },
                    { k: null,        l: "Action"     },
                  ].map((col, ci) => (
                    <th key={ci}
                      onClick={() => col.k && handleSort(col.k)}
                      style={{ padding: "10px 14px", textAlign: ci === 7 ? "right" : "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap", cursor: col.k ? "pointer" : "default", userSelect: "none" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {col.l} {col.k && sortIcon(col.k)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((rec: any) => {
                  const sc = STATUS_CFG[rec.status] || STATUS_CFG.PRESENT;
                  const recDate = new Date(rec.date);
                  const dayName = recDate.toLocaleDateString("en-IN", { weekday: "short" });
                  const isToday2 = isSameDay(recDate, today);
                  const canCheckout = isToday2 && rec.loginTime && !rec.logoutTime;

                  let durLabel = "—";
                  if (rec.loginTime && rec.logoutTime && rec.totalWorkHours != null) {
                    const h = Math.floor(rec.totalWorkHours);
                    const m = Math.round((rec.totalWorkHours % 1) * 60);
                    durLabel = `${h}h ${m}m`;
                  } else if (rec.loginTime && !rec.logoutTime && isToday2) {
                    const secs2 = Math.floor((Date.now() - new Date(rec.loginTime).getTime()) / 1000);
                    durLabel = fmtLiveDuration(secs2) + " ⚡";
                  }

                  return (
                    <tr key={rec.id} style={{ borderBottom: "1px solid #f1f5f9", background: isToday2 ? `${accent}08` : "transparent" }}>
                      <td style={{ padding: "12px 14px", fontSize: 12, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap" }}>
                        {fmtDateLabel(rec.date)}
                        {isToday2 && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "2px 6px", borderRadius: 4 }}>TODAY</span>}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 11, color: "#64748b" }}>{dayName}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 10, fontWeight: 700, background: sc.bg, color: sc.c, border: `1px solid ${sc.border}` }}>{sc.label}</span>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#334155", fontWeight: 600 }}>{fmtTime(rec.loginTime)}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: rec.logoutTime ? "#334155" : "#94a3b8", fontWeight: rec.logoutTime ? 600 : 400 }}>
                        {rec.logoutTime ? fmtTime(rec.logoutTime) : (isToday2 && rec.loginTime ? <span style={{ fontSize: 10, color: accent, fontWeight: 600 }}>Active</span> : "—")}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 11, color: "#334155", fontWeight: 600, whiteSpace: "nowrap" }}>{durLabel}</td>
                      <td style={{ padding: "12px 14px", fontSize: 10, color: "#64748b", maxWidth: 160 }}>
                        {rec.loginLocation && (
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={rec.loginLocation}>
                            <MapPin size={9} style={{ marginRight: 3, verticalAlign: "middle" }} />{rec.loginLocation}
                          </div>
                        )}
                        {rec.logoutLocation && (
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 3, color: "#94a3b8" }} title={rec.logoutLocation}>
                            <LogOut size={9} style={{ marginRight: 3, verticalAlign: "middle" }} />{rec.logoutLocation}
                          </div>
                        )}
                        {!rec.loginLocation && !rec.logoutLocation && "—"}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        {canCheckout && (
                          <button onClick={handleCheckout} disabled={checkoutLoading}
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid #d1fae5", background: checkoutLoading ? "#f8fafc" : "#f0fdf4", color: "#059669", fontSize: 10, fontWeight: 700, cursor: checkoutLoading ? "not-allowed" : "pointer", opacity: checkoutLoading ? 0.6 : 1 }}>
                            {checkoutLoading ? <Loader2 size={11} style={{ animation: "spin .7s linear infinite" }} /> : <LogOut size={11} />}
                            {checkoutLoading ? "Saving…" : "Check Out"}
                          </button>
                        )}
                        {!canCheckout && rec.logoutTime && (
                          <CheckCircle2 size={14} color="#16a34a" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {sorted.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", borderTop: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Showing {sorted.length} of {attendance.length} records</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>
              {attendancePercent}% attendance this month · {totalHours.toFixed(1)}h total
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
