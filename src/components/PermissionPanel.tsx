"use client";
import { Shield, Check, X, Info } from "lucide-react";

const ROLES = [
  { key: "HOSPITAL_ADMIN", label: "Hospital Admin", color: "#0E898F" },
  { key: "DOCTOR",         label: "Doctor",         color: "#3b82f6" },
  { key: "RECEPTIONIST",   label: "Receptionist",   color: "#8b5cf6" },
  { key: "SUB_DEPT_HEAD",  label: "Sub-Dept Head",  color: "#f59e0b" },
  { key: "FINANCE_HEAD",   label: "Finance Head",   color: "#10b981" },
  { key: "STAFF",          label: "Staff",          color: "#64748b" },
];

const PERMISSION_GROUPS: { group: string; permissions: { code: string; label: string }[] }[] = [
  {
    group: "Patient",
    permissions: [
      { code: "PATIENT_VIEW",    label: "View Patients" },
      { code: "PATIENT_CREATE",  label: "Register Patients" },
      { code: "PATIENT_UPDATE",  label: "Update Patients" },
      { code: "PATIENT_HISTORY", label: "View History" },
    ],
  },
  {
    group: "Appointments",
    permissions: [
      { code: "APPT_VIEW",   label: "View Appointments" },
      { code: "APPT_CREATE", label: "Book Appointments" },
      { code: "APPT_UPDATE", label: "Update Appointments" },
      { code: "APPT_CANCEL", label: "Cancel Appointments" },
    ],
  },
  {
    group: "Prescription & Procedures",
    permissions: [
      { code: "RX_CREATE",         label: "Write Prescriptions" },
      { code: "RX_VIEW",           label: "View Prescriptions" },
      { code: "PROCEDURE_PERFORM", label: "Perform Procedures" },
    ],
  },
  {
    group: "Billing & Finance",
    permissions: [
      { code: "BILL_VIEW",       label: "View Bills" },
      { code: "BILL_CREATE",     label: "Create Bills" },
      { code: "BILL_UPDATE",     label: "Edit Bills" },
      { code: "PAYMENT_PROCESS", label: "Process Payments" },
      { code: "FINANCE_REPORTS", label: "Finance Reports" },
      { code: "DATA_EXPORT",     label: "Export Data" },
    ],
  },
  {
    group: "General",
    permissions: [
      { code: "DEPT_VIEW",    label: "View Departments" },
      { code: "REPORTS_VIEW", label: "View Reports" },
      { code: "INV_VIEW",     label: "View Inventory" },
    ],
  },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  HOSPITAL_ADMIN: ["*"],
  DOCTOR: ["PATIENT_VIEW","PATIENT_CREATE","PATIENT_UPDATE","PATIENT_HISTORY","APPT_VIEW","RX_CREATE","RX_VIEW","PROCEDURE_PERFORM","REPORTS_VIEW","DEPT_VIEW"],
  RECEPTIONIST: ["PATIENT_VIEW","PATIENT_CREATE","PATIENT_UPDATE","APPT_VIEW","APPT_CREATE","APPT_UPDATE","APPT_CANCEL","BILL_VIEW","BILL_CREATE","PAYMENT_PROCESS","DEPT_VIEW"],
  SUB_DEPT_HEAD: ["PATIENT_VIEW","PATIENT_HISTORY","PROCEDURE_PERFORM","RX_VIEW","REPORTS_VIEW","INV_VIEW","DEPT_VIEW"],
  FINANCE_HEAD: ["BILL_VIEW","BILL_CREATE","BILL_UPDATE","PAYMENT_PROCESS","FINANCE_REPORTS","REPORTS_VIEW","DATA_EXPORT"],
  STAFF: ["PATIENT_VIEW","APPT_VIEW","INV_VIEW"],
};

function hasPermission(role: string, code: string): boolean {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  return perms.includes("*") || perms.includes(code);
}

export default function PermissionPanel() {
  return (
    <div style={{ fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        .perm-wrap { overflow-x: auto; }
        .perm-tbl { width: 100%; border-collapse: collapse; min-width: 700px; }
        .perm-tbl th { padding: 10px 14px; font-size: 11px; font-weight: 700; color: #fff; text-align: center; white-space: nowrap; }
        .perm-tbl th.perm-label-col { text-align: left; color: #94a3b8; background: #f8fafc; }
        .perm-tbl td { padding: 9px 14px; font-size: 13px; border-bottom: 1px solid #f1f5f9; text-align: center; }
        .perm-tbl td.perm-name { text-align: left; color: #475569; font-weight: 500; }
        .perm-group-row td { background: #f8fafc; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: .07em; padding: 8px 14px; border-bottom: 1px solid #e2e8f0; }
        .perm-check { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 7px; }
        .perm-yes { background: #f0fdf4; }
        .perm-no  { background: #f8fafc; }
        .perm-star { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 7px; background: #e0f2fe; color: #0369a1; font-size: 12px; font-weight: 800; }
      `}</style>

      {/* Info banner */}
      <div style={{ background: "#f0f9ff", border: "1.5px solid #bae6fd", borderRadius: 14, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 12 }}>
        <Info size={18} color="#0369a1" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0c4a6e", marginBottom: 3 }}>Role-Based Access Control (RBAC)</div>
          <div style={{ fontSize: 12, color: "#0369a1", lineHeight: 1.6 }}>
            Permissions are enforced server-side on every API request. Hospital Admin has full access (★).
            These are the default grants — individual user overrides can be configured via the Permissions API.
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        {ROLES.map(r => (
          <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#475569", fontWeight: 600 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: r.color }} />
            {r.label}
          </div>
        ))}
      </div>

      {/* Permission Matrix */}
      <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
        <div className="perm-wrap">
          <table className="perm-tbl">
            <thead>
              <tr>
                <th className="perm-label-col" style={{ width: 200 }}>Permission</th>
                {ROLES.map(r => (
                  <th key={r.key} style={{ background: r.color, minWidth: 90 }}>
                    <div>{r.label.split(" ")[0]}</div>
                    <div style={{ fontSize: 10, fontWeight: 400, opacity: .8 }}>{r.label.split(" ").slice(1).join(" ")}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.map(group => (
                <>
                  <tr key={`g-${group.group}`}>
                    <td colSpan={ROLES.length + 1} className="perm-group-row">{group.group}</td>
                  </tr>
                  {group.permissions.map(perm => (
                    <tr key={perm.code}>
                      <td className="perm-name">
                        <div style={{ fontWeight: 600, color: "#334155" }}>{perm.label}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>{perm.code}</div>
                      </td>
                      {ROLES.map(role => {
                        const perms = ROLE_PERMISSIONS[role.key] ?? [];
                        const isAll = perms.includes("*");
                        const hasPerm = hasPermission(role.key, perm.code);
                        return (
                          <td key={role.key}>
                            {isAll ? (
                              <span className="perm-star" title="Full Access">★</span>
                            ) : hasPerm ? (
                              <span className="perm-check perm-yes"><Check size={13} color="#16a34a" strokeWidth={3} /></span>
                            ) : (
                              <span className="perm-check perm-no"><X size={12} color="#cbd5e1" strokeWidth={2} /></span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginTop: 20 }}>
        {ROLES.map(r => {
          const perms = ROLE_PERMISSIONS[r.key] ?? [];
          const isAll = perms.includes("*");
          const total = PERMISSION_GROUPS.reduce((s, g) => s + g.permissions.length, 0);
          const count = isAll ? total : PERMISSION_GROUPS.reduce((s, g) => s + g.permissions.filter(p => perms.includes(p.code)).length, 0);
          return (
            <div key={r.key} style={{ background: "#fff", border: `2px solid ${r.color}22`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: r.color, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>{r.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b" }}>{isAll ? "All" : count}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>of {total} permissions</div>
              <div style={{ marginTop: 8, height: 4, background: "#f1f5f9", borderRadius: 100, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(count / total) * 100}%`, background: r.color, borderRadius: 100 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
