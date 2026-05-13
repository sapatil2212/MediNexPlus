"use client";

import { useAppointment } from "./AppointmentProvider";
import { usePathname } from "next/navigation";
import { Calendar, Phone } from "lucide-react";
import styles from "./mobile-appointment.module.css";

export default function MobileAppointment() {
  const { openAppointment } = useAppointment();
  const pathname = usePathname();

  const isPublicPage = pathname === "/" || pathname?.match(/^\/(login|signup|about|blog|contact|treatments|privacy-policy|terms-of-service|cookie-policy)/);
  const isDashboard = pathname?.match(/^\/(administrative|clinical|diagnostic|doctor|finance|hospitaladmin|nursingadmin|parentdept|receptionist|staff|subdept|superadmin|support)/);

  if (isPublicPage || isDashboard) return null;

  return (
    <div className={styles.mobileContainer}>
      <div className={styles.buttonGroup}>
        <a href="tel:+919059053938" className={styles.contactButton}>
          <Phone size={16} className={styles.icon} />
          <span>Contact Us</span>
        </a>
        <button className={styles.appointmentButton} onClick={openAppointment}>
          <Calendar size={16} className={styles.icon} />
          <span>Book Appointment</span>
        </button>
      </div>
    </div>
  );
}
