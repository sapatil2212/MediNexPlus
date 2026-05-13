"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import AppointmentModal from "./AppointmentModal";

const AppointmentContext = createContext<{
  openAppointment: () => void;
}>({ openAppointment: () => {} });

export function useAppointment() {
  return useContext(AppointmentContext);
}

export function AppointmentProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AppointmentContext.Provider value={{ openAppointment: () => setIsOpen(true) }}>
      {children}
      <AppointmentModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </AppointmentContext.Provider>
  );
}
