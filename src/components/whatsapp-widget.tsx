"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from "./whatsapp-widget.module.css";

export default function WhatsAppWidget() {
  const pathname = usePathname();
  const isPublicPage = pathname === "/" || pathname?.match(/^\/(login|signup|about|blog|contact|treatments|privacy-policy|terms-of-service|cookie-policy)/);
  const isDashboard = pathname?.match(/^\/(administrative|clinical|diagnostic|doctor|finance|hospitaladmin|nursingadmin|parentdept|receptionist|staff|subdept|superadmin|support)/);

  if (isPublicPage || isDashboard) return null;
  const phoneNumber = "+919059053938";
  const message = "Hello MediNex+, I would like to learn more about your hospital management platform.";
  const whatsappUrl = `https://wa.me/${phoneNumber.replace("+", "")}?text=${encodeURIComponent(message)}`;

  return (
    <a 
      href={whatsappUrl} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={styles.whatsappWidget}
      aria-label="Chat on WhatsApp"
    >
      <div className={styles.iconWrapper}>
        <Image 
          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
          alt="WhatsApp" 
          width={32} 
          height={32} 
          className={styles.whatsappLogo}
        />
      </div>
      <div className={styles.tooltip}>Chat with us</div>
    </a>
  );
}
