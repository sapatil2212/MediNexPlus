"use client";

import { useState, useRef, useEffect } from "react";
import { 
  X,
  Check,
  User,
  MapPin,
  Stethoscope,
  Paperclip,
  Plane,
  Send,
  ChevronDown,
  Search
} from "lucide-react";
import { medicalTourismData } from "./tourismData";
import styles from "./medical-tourism.module.css";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedZone?: string;
  preSelectedState?: string;
}

export default function BookingModal({ isOpen, onClose, preSelectedZone, preSelectedState }: BookingModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    region: preSelectedZone || "",
    state: preSelectedState || "",
    treatmentType: "",
    procedure: "",
    concern: "",
    travelMonth: "",
    persons: "",
    contactMethod: "whatsapp",
    consent: false
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  
  // Dropdown states
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showTreatmentDropdown, setShowTreatmentDropdown] = useState(false);
  const [showProcedureDropdown, setShowProcedureDropdown] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [regionSearch, setRegionSearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  
  const regionRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<HTMLDivElement>(null);
  const treatmentRef = useRef<HTMLDivElement>(null);
  const procedureRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (regionRef.current && !regionRef.current.contains(event.target as Node)) setShowRegionDropdown(false);
      if (stateRef.current && !stateRef.current.contains(event.target as Node)) setShowStateDropdown(false);
      if (treatmentRef.current && !treatmentRef.current.contains(event.target as Node)) setShowTreatmentDropdown(false);
      if (procedureRef.current && !procedureRef.current.contains(event.target as Node)) setShowProcedureDropdown(false);
      if (monthRef.current && !monthRef.current.contains(event.target as Node)) setShowMonthPicker(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update form when preSelectedZone or preSelectedState changes
  useEffect(() => {
    if (preSelectedZone || preSelectedState) {
      setFormData(prev => ({ 
        ...prev, 
        region: preSelectedZone || "", 
        state: preSelectedState || "" 
      }));
    }
  }, [preSelectedZone, preSelectedState]);

  // Filter regions and states
  const filteredRegions = medicalTourismData.filter(z => z.name.toLowerCase().includes(regionSearch.toLowerCase()));
  const selectedRegionData = medicalTourismData.find(z => z.id === formData.region);
  const availableStates = selectedRegionData?.states || [];
  const filteredStates = availableStates.filter(s => s.name.toLowerCase().includes(stateSearch.toLowerCase()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    const regionName = medicalTourismData.find(z => z.id === formData.region)?.name || formData.region;
    const stateName  = availableStates.find(s => s.id === formData.state)?.name || formData.state;
    const procedureLabel = formData.procedure.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    const treatmentLabel = formData.treatmentType === "dental" ? "Dental" : formData.treatmentType === "aesthetic" ? "Aesthetic / Cosmetic" : formData.treatmentType;

    const detailParts: string[] = [];
    if (regionName)     detailParts.push(`Region: ${regionName}`);
    if (stateName)      detailParts.push(`Destination State: ${stateName}`);
    if (procedureLabel) detailParts.push(`Procedure: ${procedureLabel}`);
    if (formData.travelMonth) detailParts.push(`Preferred Travel Month: ${new Date(formData.travelMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}`);
    if (formData.persons)    detailParts.push(`Number of Persons: ${formData.persons}`);
    if (formData.contactMethod) detailParts.push(`Preferred Contact: ${formData.contactMethod.charAt(0).toUpperCase() + formData.contactMethod.slice(1)}`);
    if (formData.concern) detailParts.push(`\nPatient Concern:\n${formData.concern}`);

    const payload = {
      fullName:    formData.name,
      mobile:      formData.phone,
      email:       formData.email,
      country:     formData.country,
      state:       stateName,
      department:  treatmentLabel,
      enquiryType: "MEDICAL_TOURISM",
      details:     detailParts.join("\n"),
    };

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          onClose();
        }, 3500);
      } else {
        setSubmitError(data.message || "Submission failed. Please try again.");
      }
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3>Book Your Medical Journey</h3>
            <button className={styles.modalClose} onClick={onClose}><X size={20} /></button>
          </div>
          
          <div className={styles.modalBody}>
            {submitted ? (
              <div className={styles.successMessage}>
                <div className={styles.successIcon}><Check size={32} /></div>
                <h4>Request Submitted!</h4>
                <p>A confirmation email has been sent to <strong>{formData.email}</strong>. Our team will contact you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.bookingForm}>
                {/* Basic Details */}
                <div className={styles.formSection}>
                  <h4 className={styles.formSectionTitle}><User size={14} /> Basic Details</h4>
                  <div className={styles.formGrid}>
                    <input type="text" placeholder="Full Name *" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={styles.formInput} />
                    <input type="email" placeholder="Email Address *" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={styles.formInput} />
                    <input type="tel" placeholder="Phone Number (with country code) *" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className={styles.formInput} />
                    <input type="text" placeholder="Country *" required value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} className={styles.formInput} />
                  </div>
                </div>

                {/* Region & State */}
                <div className={styles.formSection}>
                  <h4 className={styles.formSectionTitle}><MapPin size={14} /> Destination</h4>
                  <div className={styles.formGrid}>
                    {/* Region Dropdown */}
                    <div className={styles.searchableDropdown} ref={regionRef}>
                      <button type="button" className={styles.dropdownTrigger} onClick={() => setShowRegionDropdown(!showRegionDropdown)}>
                        <span>{formData.region ? medicalTourismData.find(z => z.id === formData.region)?.name.split(":")[0] : "Select Region *"}</span>
                        <ChevronDown size={14} className={showRegionDropdown ? styles.chevronOpen : ""} />
                      </button>
                      {showRegionDropdown && (
                        <div className={styles.dropdownMenu}>
                          <div className={styles.dropdownSearch}>
                            <Search size={12} />
                            <input type="text" placeholder="Search regions..." value={regionSearch} onChange={(e) => setRegionSearch(e.target.value)} autoFocus />
                          </div>
                          <div className={styles.dropdownList}>
                            {filteredRegions.map((zone) => (
                              <button key={zone.id} type="button" className={formData.region === zone.id ? styles.dropdownItemActive : ""} onClick={() => { setFormData({...formData, region: zone.id, state: ""}); setShowRegionDropdown(false); setRegionSearch(""); }}>
                                {zone.name.split(":")[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* State Dropdown */}
                    <div className={styles.searchableDropdown} ref={stateRef}>
                      <button type="button" className={`${styles.dropdownTrigger} ${!formData.region ? styles.disabled : ""}`} onClick={() => formData.region && setShowStateDropdown(!showStateDropdown)} disabled={!formData.region}>
                        <span>{formData.state ? availableStates.find(s => s.id === formData.state)?.name : formData.region ? "Select State *" : "Select region first"}</span>
                        <ChevronDown size={14} className={showStateDropdown ? styles.chevronOpen : ""} />
                      </button>
                      {showStateDropdown && formData.region && (
                        <div className={styles.dropdownMenu}>
                          <div className={styles.dropdownSearch}>
                            <Search size={12} />
                            <input type="text" placeholder="Search states..." value={stateSearch} onChange={(e) => setStateSearch(e.target.value)} autoFocus />
                          </div>
                          <div className={styles.dropdownList}>
                            {filteredStates.map((state) => (
                              <button key={state.id} type="button" className={formData.state === state.id ? styles.dropdownItemActive : ""} onClick={() => { setFormData({...formData, state: state.id}); setShowStateDropdown(false); setStateSearch(""); }}>
                                {state.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Treatment */}
                <div className={styles.formSection}>
                  <h4 className={styles.formSectionTitle}><Stethoscope size={14} /> Treatment</h4>
                  <div className={styles.formGrid}>
                    {/* Treatment Type */}
                    <div className={styles.searchableDropdown} ref={treatmentRef}>
                      <button type="button" className={styles.dropdownTrigger} onClick={() => setShowTreatmentDropdown(!showTreatmentDropdown)}>
                        <span>{formData.treatmentType ? (formData.treatmentType === "dental" ? "Dental" : "Aesthetic / Cosmetic") : "Treatment Type *"}</span>
                        <ChevronDown size={14} className={showTreatmentDropdown ? styles.chevronOpen : ""} />
                      </button>
                      {showTreatmentDropdown && (
                        <div className={styles.dropdownMenu}>
                          <div className={styles.dropdownList}>
                            <button type="button" className={formData.treatmentType === "dental" ? styles.dropdownItemActive : ""} onClick={() => { setFormData({...formData, treatmentType: "dental", procedure: ""}); setShowTreatmentDropdown(false); }}>Dental</button>
                            <button type="button" className={formData.treatmentType === "aesthetic" ? styles.dropdownItemActive : ""} onClick={() => { setFormData({...formData, treatmentType: "aesthetic", procedure: ""}); setShowTreatmentDropdown(false); }}>Aesthetic / Cosmetic</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Procedure */}
                    <div className={styles.searchableDropdown} ref={procedureRef}>
                      <button type="button" className={`${styles.dropdownTrigger} ${!formData.treatmentType ? styles.disabled : ""}`} onClick={() => formData.treatmentType && setShowProcedureDropdown(!showProcedureDropdown)} disabled={!formData.treatmentType}>
                        <span>{formData.procedure ? formData.procedure.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : formData.treatmentType ? "Procedure" : "Select treatment type first"}</span>
                        <ChevronDown size={14} className={showProcedureDropdown ? styles.chevronOpen : ""} />
                      </button>
                      {showProcedureDropdown && formData.treatmentType && (
                        <div className={styles.dropdownMenu}>
                          <div className={styles.dropdownList}>
                            {(formData.treatmentType === "dental" 
                              ? ["dental-implants", "smile-design", "root-canal", "teeth-whitening", "other"]
                              : ["hair-transplant", "skin-treatment", "cosmetic-surgery", "botox-fillers", "other"]
                            ).map((proc) => (
                              <button key={proc} type="button" className={formData.procedure === proc ? styles.dropdownItemActive : ""} onClick={() => { setFormData({...formData, procedure: proc}); setShowProcedureDropdown(false); }}>
                                {proc.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <textarea placeholder="Describe Your Concern *" required value={formData.concern} onChange={(e) => setFormData({...formData, concern: e.target.value})} className={styles.formTextarea} rows={3} />
                </div>

                {/* Upload */}
                <div className={styles.formSection}>
                  <h4 className={styles.formSectionTitle}><Paperclip size={14} /> Upload Reports <span className={styles.optional}>(Optional)</span></h4>
                  <label className={styles.uploadArea}>
                    <Paperclip size={20} />
                    <span>Upload Reports / Photos</span>
                    <small>X-ray, face, teeth images</small>
                    <input type="file" multiple accept="image/*,.pdf" className={styles.fileInput} />
                  </label>
                </div>

                {/* Travel Info */}
                <div className={styles.formSection}>
                  <h4 className={styles.formSectionTitle}><Plane size={14} /> Travel Info</h4>
                  <div className={styles.formGrid}>
                    {/* Month Picker */}
                    <div className={styles.searchableDropdown} ref={monthRef}>
                      <button type="button" className={styles.dropdownTrigger} onClick={() => setShowMonthPicker(!showMonthPicker)}>
                        <span>{formData.travelMonth ? new Date(formData.travelMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Preferred Travel Month"}</span>
                        <ChevronDown size={14} className={showMonthPicker ? styles.chevronOpen : ""} />
                      </button>
                      {showMonthPicker && (
                        <div className={styles.dropdownMenu}>
                          <div className={styles.dropdownList}>
                            {Array.from({ length: 12 }, (_, i) => {
                              const date = new Date();
                              date.setMonth(date.getMonth() + i);
                              const value = date.toISOString().slice(0, 7);
                              return (
                                <button key={value} type="button" className={formData.travelMonth === value ? styles.dropdownItemActive : ""} onClick={() => { setFormData({...formData, travelMonth: value}); setShowMonthPicker(false); }}>
                                  {date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <input type="number" min="1" placeholder="Number of Persons" value={formData.persons} onChange={(e) => setFormData({...formData, persons: e.target.value})} className={styles.formInput} />
                  </div>
                </div>

                {/* Contact Method */}
                <div className={styles.formSection}>
                  <div className={styles.radioGroup}>
                    <label className={`${styles.radioOption} ${formData.contactMethod === "whatsapp" ? styles.radioActive : ""}`}>
                      <input type="radio" name="contactMethod" value="whatsapp" checked={formData.contactMethod === "whatsapp"} onChange={(e) => setFormData({...formData, contactMethod: e.target.value})} />
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WhatsApp
                    </label>
                    <label className={`${styles.radioOption} ${formData.contactMethod === "call" ? styles.radioActive : ""}`}>
                      <input type="radio" name="contactMethod" value="call" checked={formData.contactMethod === "call"} onChange={(e) => setFormData({...formData, contactMethod: e.target.value})} />
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.44-5.15-3.75-6.59-6.59l1.97-1.57a.98.98 0 00.25-1.01 11.36 11.36 0 01-.56-3.53c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM5.03 5h1.5c.07.88.22 1.75.45 2.58l-1.2.96C5.4 7.56 5.16 6.32 5.03 5zM19 18.97c-1.32-.09-2.59-.35-3.8-.75l1.2-1.2c.85.24 1.72.39 2.6.44v1.51zM12 3C7.46 3 3.34 4.78.29 8.67c-.18.25-.2.58-.03.84.17.26.5.37.79.25 1.18-.45 2.45-.7 3.77-.7 5.52 0 10 4.48 10 10 0 1.32-.25 2.59-.7 3.77-.12.29-.01.62.25.79.26.17.59.15.84-.03C19.22 20.66 21 16.54 21 12c0-4.97-4.03-9-9-9z"/></svg>
                      Call
                    </label>
                    <label className={`${styles.radioOption} ${formData.contactMethod === "email" ? styles.radioActive : ""}`}>
                      <input type="radio" name="contactMethod" value="email" checked={formData.contactMethod === "email"} onChange={(e) => setFormData({...formData, contactMethod: e.target.value})} />
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                      Email
                    </label>
                  </div>
                </div>

                {/* Consent */}
                <div className={styles.consentCheck}>
                  <input type="checkbox" id="modalConsent" required checked={formData.consent} onChange={(e) => setFormData({...formData, consent: e.target.checked})} />
                  <label htmlFor="modalConsent">
                    I agree to be contacted regarding my treatment &amp; accept the{" "}
                    <button type="button" className={styles.termsLink} onClick={() => setShowTerms(true)}>Terms &amp; Conditions</button> *
                  </label>
                </div>

                {submitError && (
                  <div style={{ background: "#fff5f5", border: "1px solid #feb2b2", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#c53030", display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {submitError}
                  </div>
                )}

                <button type="submit" disabled={submitting} className={styles.submitBtn} style={{ opacity: submitting ? 0.75 : 1, cursor: submitting ? "not-allowed" : "pointer" }}>
                  {submitting ? (
                    <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin .7s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Submitting...</>
                  ) : (
                    <><Send size={16} /> Get Free Consultation</>
                  )}
                </button>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTerms && (
        <div className={styles.termsOverlay} onClick={() => setShowTerms(false)}>
          <div className={styles.termsModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.termsHeader}>
              <h3>Terms &amp; Conditions</h3>
              <button className={styles.termsClose} onClick={() => setShowTerms(false)}><X size={20} /></button>
            </div>
            <div className={styles.termsBody}>
              <h4>1. Medical Tourism Services</h4>
              <p>By submitting this form, you consent to receive communication from MediNex+ regarding medical tourism packages, treatment options, and related services. Our team may contact you via phone, email, or WhatsApp based on your preferred contact method.</p>

              <h4>2. Personal Information</h4>
              <p>All personal information provided through this form is handled with strict confidentiality. We collect your details solely for the purpose of processing your medical tourism inquiry and providing personalized healthcare recommendations.</p>

              <h4>3. Medical Records</h4>
              <p>Any medical reports, images, or documents you upload are stored securely and accessed only by authorized medical professionals for treatment evaluation purposes. These records will not be shared with third parties without your explicit consent.</p>

              <h4>4. Treatment Estimates</h4>
              <p>Package prices displayed are indicative starting prices and may vary based on individual treatment plans, duration of stay, and specific medical requirements. A detailed cost breakdown will be provided after initial consultation.</p>

              <h4>5. Travel &amp; Accommodation</h4>
              <p>Travel arrangements and accommodation bookings are subject to availability. While we strive to match your preferences, actual arrangements may differ based on seasonal availability and operational factors.</p>

              <h4>6. Cancellation &amp; Refund</h4>
              <p>Cancellation and refund policies vary based on the specific package and services booked. Detailed cancellation terms will be shared before any payment is processed.</p>

              <h4>7. Privacy Policy</h4>
              <p>We comply with applicable data protection regulations. Your data is processed in accordance with our Privacy Policy and is not sold or shared for marketing purposes by third parties.</p>

              <h4>8. Consent to Contact</h4>
              <p>By checking the consent checkbox and submitting this form, you authorize MediNex+ to contact you regarding your medical tourism inquiry. You may withdraw this consent at any time by contacting our support team.</p>
            </div>
            <div className={styles.termsFooter}>
              <button className={styles.termsAcceptBtn} onClick={() => { setFormData({ ...formData, consent: true }); setShowTerms(false); }}>
                <Check size={14} /> I Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
