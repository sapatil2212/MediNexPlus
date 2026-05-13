"use client";

import DeptDashboardPage from "@/components/DeptDashboardPage";
import { Building2 } from "lucide-react";

const cfg = {
  accent:       "#2563eb",
  accent2:      "#1d4ed8",
  accentLight:  "#eff6ff",
  accentBorder: "#bfdbfe",
  label:        "Administrative",
  basePath:     "/administrative/dashboard",
  icon:         <Building2 size={26} color="#fff" />,
};

export default function AdminDashboardPage() {
  return <DeptDashboardPage cfg={cfg} />;
}
