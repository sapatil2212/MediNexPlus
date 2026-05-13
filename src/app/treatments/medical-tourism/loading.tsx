import React from "react";
import styles from "./medical-tourism.module.css";

export default function Loading() {
  return (
    <div className={styles.page}>
      <div className="container" style={{ paddingTop: "120px", paddingBottom: "80px" }}>
        {/* Hero Skeleton */}
        <div style={{ display: "flex", gap: "40px", marginBottom: "80px", flexDirection: "column", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ 
            height: "400px", 
            width: "100%", 
            background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
            borderRadius: "24px" 
          }}></div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ 
                height: "350px", 
                background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
                borderRadius: "20px" 
              }}></div>
            ))}
          </div>
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}} />
      </div>
    </div>
  );
}
