"use client";

import DeptDashboardPage from "@/components/DeptDashboardPage";
import { Microscope } from "lucide-react";

const cfg = {
  accent:       "#0E898F",
  accent2:      "#07595D",
  accentLight:  "#E6F4F4",
  accentBorder: "#B3E0E0",
  label:        "Diagnostic",
  basePath:     "/diagnostic/dashboard",
  icon:         <Microscope size={26} color="#fff" />,
};

export default function DiagnosticDashboardPage() {
  return <DeptDashboardPage cfg={cfg} />;
}
