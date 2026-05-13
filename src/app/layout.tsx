import type { Metadata, Viewport } from "next";
import { AppointmentProvider } from "@/components/AppointmentProvider";
import MobileAppointment from "@/components/mobile-appointment";
import WhatsAppWidget from "@/components/whatsapp-widget";
import AIChatbot from "@/components/ai-chatbot";
import Preloader from "@/components/Preloader";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "MediNex+ | Smarter Healthcare Connecting Doctors and Patients",
  description:
    "MediNex+ is a multi-tenant hospital management SaaS platform connecting doctors and patients. Manage appointments, staff, billing, and analytics — all in one secure platform.",
  keywords: [
    "hospital management",
    "healthcare saas",
    "HMS",
    "doctor appointment",
    "multi-tenant",
    "medical software",
    "patient management",
    "telemedicine",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo/favicon-icon.png", type: "image/png" }
    ],
  },
  openGraph: {
    title: "MediNex+ | Smarter Healthcare Connecting Doctors and Patients",
    description:
      "MediNex+ is a multi-tenant hospital management SaaS platform connecting doctors and patients.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Preloader />
        <AppointmentProvider>
          {children}
          <WhatsAppWidget />
          <AIChatbot />
          <MobileAppointment />
        </AppointmentProvider>
      </body>
    </html>
  );
}
