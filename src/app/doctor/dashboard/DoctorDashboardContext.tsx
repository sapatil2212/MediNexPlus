"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface DoctorContextType {
  doctor: any;
  setDoctor: (d: any) => void;
  loading: boolean;
  logout: () => Promise<void>;
  accent: string;
  doctorName: string;
  deptName: string;
  initials: (name: string) => string;
  refreshDoctor: () => Promise<void>;
}

const DoctorDashboardContext = createContext<DoctorContextType | null>(null);

function getDeptAccent(deptName?: string): string {
  return "#0E898F";
}

export function DoctorDashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDoctor = async () => {
    try {
      const authRes = await fetch("/api/auth/me", { credentials: "include" });
      const authData = await authRes.json();
      if (!authData.success || authData.data.role !== "DOCTOR") {
        router.push("/login");
        return;
      }
      const docRes = await fetch("/api/doctors/me", { credentials: "include" });
      const docData = await docRes.json();
      if (docData.success) {
        setDoctor(docData.data);
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctor();
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  };

  const initials = (name: string) => name.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();
  const doctorName = doctor?.name || "Doctor";
  const deptName = doctor?.department?.name || "General";
  const accent = getDeptAccent(deptName);

  return (
    <DoctorDashboardContext.Provider value={{
      doctor,
      setDoctor,
      loading,
      logout,
      accent,
      doctorName,
      deptName,
      initials,
      refreshDoctor: fetchDoctor,
    }}>
      {children}
    </DoctorDashboardContext.Provider>
  );
}

export function useDoctorDashboard() {
  const context = useContext(DoctorDashboardContext);
  if (!context) {
    throw new Error("useDoctorDashboard must be used within DoctorDashboardProvider");
  }
  return context;
}

export function useDoctorDashboardOptional() {
  return useContext(DoctorDashboardContext);
}
