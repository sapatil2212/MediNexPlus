"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SubDeptProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/subdept/dashboard?tab=account-settings");
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
      <style suppressHydrationWarning>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#64748b" }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
        <span>Redirecting...</span>
      </div>
    </div>
  );
}
