"use client";

import { motion } from "framer-motion";
import { 
  MapPin, 
  Clock, 
  IndianRupee, 
  CheckCircle2, 
  Stethoscope, 
  Plane, 
  Hotel, 
  MessageCircle,
  Calendar,
  ChevronLeft,
  ArrowRight,
  Phone,
  Star,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  User,
  Mail,
  Send,
  Check,
  Globe,
  Paperclip,
  Users,
  CalendarDays,
  ChevronDown,
  Search,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { medicalTourismData, StateDetail } from "../tourismData";
import mtStyles from "../medical-tourism.module.css";
import zoneStyles from "./zone.module.css";
import stateStyles from "./state.module.css";
import BookingModal from "../BookingModal";
// heroStyles no longer needed for zone view
import { useAppointment } from "@/components/AppointmentProvider";

// ── Determine if slug is a zone or a state ──────────────────────────────
function resolve(slug: string) {
  // Try zone first
  const zone = medicalTourismData.find(z => z.id === slug);
  if (zone) return { type: "zone" as const, zone, state: null };
  // Try state
  for (const z of medicalTourismData) {
    const st = z.states.find(s => s.id === slug);
    if (st) return { type: "state" as const, zone: null, state: st };
  }
  return { type: "notfound" as const, zone: null, state: null };
}

// ── State Detail View (Property-style layout) ────────────────────────────
function StateDetailView({ selectedState }: { selectedState: StateDetail }) {
  const { openAppointment } = useAppointment();
  const [activeTab, setActiveTab] = useState<"overview" | "highlights" | "services">("overview");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    region: "",
    state: "",
    treatmentType: "",
    procedure: "",
    concern: "",
    travelMonth: "",
    persons: "",
    contactMethod: "whatsapp",
    consent: false
  });
  const [submitted, setSubmitted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  
  // Searchable dropdown states
  const [regionSearch, setRegionSearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showTreatmentDropdown, setShowTreatmentDropdown] = useState(false);
  const [showProcedureDropdown, setShowProcedureDropdown] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<HTMLDivElement>(null);
  const treatmentRef = useRef<HTMLDivElement>(null);
  const procedureRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (regionRef.current && !regionRef.current.contains(event.target as Node)) {
        setShowRegionDropdown(false);
      }
      if (stateRef.current && !stateRef.current.contains(event.target as Node)) {
        setShowStateDropdown(false);
      }
      if (treatmentRef.current && !treatmentRef.current.contains(event.target as Node)) {
        setShowTreatmentDropdown(false);
      }
      if (procedureRef.current && !procedureRef.current.contains(event.target as Node)) {
        setShowProcedureDropdown(false);
      }
      if (monthRef.current && !monthRef.current.contains(event.target as Node)) {
        setShowMonthPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter regions and states based on search
  const filteredRegions = medicalTourismData.filter(z => 
    z.name.toLowerCase().includes(regionSearch.toLowerCase())
  );
  
  const selectedRegionData = medicalTourismData.find(z => z.id === formData.region);
  const availableStates = selectedRegionData?.states || [];
  const filteredStates = availableStates.filter(s => 
    s.name.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  // Generate additional images for gallery (using same image for demo)
  const galleryImages = [
    selectedState.image,
    selectedState.image,
    selectedState.image,
    selectedState.image
  ];
  const [activeImage, setActiveImage] = useState(0);

  return (
    <>
      <Navbar />
      <main className={stateStyles.page}>
        {/* Breadcrumb */}
        <div className={stateStyles.breadcrumb}>
          <div className="container">
            <Link href="/treatments/medical-tourism" className={stateStyles.backLink}>
              <ChevronLeft size={16} /> Back to Medical Tourism
            </Link>
          </div>
        </div>

        {/* Main Content Grid */}
        <section className={stateStyles.mainSection}>
          <div className="container">
            <div className={stateStyles.contentGrid}>
              {/* Left Column */}
              <div className={stateStyles.leftColumn}>
                {/* Image Gallery */}
                <div className={stateStyles.gallery}>
                  <div className={stateStyles.mainImageContainer}>
                    <Image
                      src={galleryImages[activeImage]}
                      alt={selectedState.name}
                      fill
                      className={stateStyles.mainImage}
                      priority
                    />
                    <div className={stateStyles.imageBadge}>Medical Tourism</div>
                    <button 
                      className={`${stateStyles.navButton} ${stateStyles.prevButton}`}
                      onClick={() => setActiveImage(prev => prev === 0 ? galleryImages.length - 1 : prev - 1)}
                    >
                      <PrevIcon size={20} />
                    </button>
                    <button 
                      className={`${stateStyles.navButton} ${stateStyles.nextButton}`}
                      onClick={() => setActiveImage(prev => prev === galleryImages.length - 1 ? 0 : prev + 1)}
                    >
                      <NextIcon size={20} />
                    </button>
                  </div>
                  <div className={stateStyles.thumbnails}>
                    {galleryImages.map((img, idx) => (
                      <button
                        key={idx}
                        className={`${stateStyles.thumbnail} ${activeImage === idx ? stateStyles.activeThumbnail : ""}`}
                        onClick={() => setActiveImage(idx)}
                      >
                        <Image src={img} alt={`View ${idx + 1}`} fill className={stateStyles.thumbnailImage} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Property Details Card */}
                <div className={stateStyles.detailsCard}>
                  <div className={stateStyles.detailsHeader}>
                    <div>
                      <h1 className={stateStyles.propertyTitle}>{selectedState.name}</h1>
                      <p className={stateStyles.propertyLocation}>
                        <MapPin size={14} /> {selectedState.tagline}
                      </p>
                    </div>
                    <div className={stateStyles.priceTag}>
                      <span className={stateStyles.priceLabel}>Starting Price</span>
                      <span className={stateStyles.priceValue}>{selectedState.startingPrice}</span>
                    </div>
                  </div>

                  {/* Key Stats */}
                  <div className={stateStyles.keyStats}>
                    <div className={stateStyles.statItem}>
                      <Clock size={18} className={stateStyles.statIcon} />
                      <div>
                        <span className={stateStyles.statValue}>{selectedState.duration}</span>
                        <span className={stateStyles.statLabel}>Duration</span>
                      </div>
                    </div>
                    <div className={stateStyles.statItem}>
                      <Hotel size={18} className={stateStyles.statIcon} />
                      <div>
                        <span className={stateStyles.statValue}>5-Star</span>
                        <span className={stateStyles.statLabel}>Accommodation</span>
                      </div>
                    </div>
                    <div className={stateStyles.statItem}>
                      <Stethoscope size={18} className={stateStyles.statIcon} />
                      <div>
                        <span className={stateStyles.statValue}>JCI</span>
                        <span className={stateStyles.statLabel}>Accredited</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs Section */}
                <div className={stateStyles.tabsSection}>
                  <div className={stateStyles.tabsHeader}>
                    <button 
                      className={`${stateStyles.tabButton} ${activeTab === "overview" ? stateStyles.activeTab : ""}`}
                      onClick={() => setActiveTab("overview")}
                    >
                      Overview
                    </button>
                    <button 
                      className={`${stateStyles.tabButton} ${activeTab === "highlights" ? stateStyles.activeTab : ""}`}
                      onClick={() => setActiveTab("highlights")}
                    >
                      Highlights
                    </button>
                    <button 
                      className={`${stateStyles.tabButton} ${activeTab === "services" ? stateStyles.activeTab : ""}`}
                      onClick={() => setActiveTab("services")}
                    >
                      Medical Services
                    </button>
                  </div>

                  <div className={stateStyles.tabContent}>
                    {activeTab === "overview" && (
                      <div className={stateStyles.overviewTab}>
                        <h3 className={stateStyles.sectionTitle}>About {selectedState.name}</h3>
                        <p className={stateStyles.description}>{selectedState.experience}</p>
                        <p className={stateStyles.description}>
                          Experience world-class healthcare combined with the rich cultural heritage of {selectedState.name}. 
                          Our curated medical tourism package includes premium accommodation, private transfers, 
                          dedicated medical assistance, and comprehensive travel insurance.
                        </p>

                        <h4 className={stateStyles.subSectionTitle}>Package Includes</h4>
                        <div className={stateStyles.includesGrid}>
                          {selectedState.includes.map(item => (
                            <div key={item} className={stateStyles.includeItem}>
                              <CheckCircle2 size={16} className={stateStyles.checkIcon} />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === "highlights" && (
                      <div className={stateStyles.highlightsTab}>
                        <h3 className={stateStyles.sectionTitle}>Tour Highlights</h3>
                        <div className={stateStyles.highlightsGrid}>
                          {selectedState.highlights.map((highlight, idx) => (
                            <div key={highlight} className={stateStyles.highlightCard}>
                              <div className={stateStyles.highlightNumber}>{idx + 1}</div>
                              <p className={stateStyles.highlightText}>{highlight}</p>
                            </div>
                          ))}
                        </div>

                        <h4 className={stateStyles.subSectionTitle} style={{ marginTop: "var(--space-6)" }}>Patient Journey</h4>
                        <div className={stateStyles.journeySteps}>
                          {selectedState.patientJourney.map((step, idx) => (
                            <div key={step} className={stateStyles.journeyStep}>
                              <div className={stateStyles.stepNumber}>{idx + 1}</div>
                              <div className={stateStyles.stepContent}>
                                <span className={stateStyles.stepTitle}>{step}</span>
                              </div>
                              {idx < selectedState.patientJourney.length - 1 && (
                                <ArrowRight size={16} className={stateStyles.stepArrow} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === "services" && (
                      <div className={stateStyles.servicesTab}>
                        <h3 className={stateStyles.sectionTitle}>Medical Services</h3>
                        <div className={stateStyles.servicesList}>
                          {selectedState.medicalServices.map(service => (
                            <div key={service} className={stateStyles.serviceItem}>
                              <div className={stateStyles.serviceIcon}>
                                <Stethoscope size={20} />
                              </div>
                              <span className={stateStyles.serviceName}>{service}</span>
                            </div>
                          ))}
                        </div>

                        <div className={stateStyles.vibeSection}>
                          <h4 className={stateStyles.subSectionTitle}>Experience Vibe</h4>
                          <div className={stateStyles.vibeTags}>
                            {selectedState.vibe.map(v => (
                              <span key={v} className={stateStyles.vibeTag}>{v}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Sticky Consultation Form */}
              <div className={stateStyles.rightColumn}>
                <div className={stateStyles.inquiryCard}>
                  <h3 className={stateStyles.inquiryTitle}>Get Free Consultation</h3>
                  <p className={stateStyles.inquirySubtitle}>Fill in the details and our experts will reach out</p>

                  {submitted ? (
                    <div className={stateStyles.successMessage}>
                      <div className={stateStyles.successIcon}>
                        <Check size={32} />
                      </div>
                      <h4>Thank You!</h4>
                      <p>We&apos;ll contact you within 24 hours.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className={stateStyles.inquiryForm}>
                      {/* Section 1: Basic Details */}
                      <div className={stateStyles.formSectionHeader}>
                        <User size={14} />
                        <span>Basic Details</span>
                      </div>

                      <div className={stateStyles.formGroup}>
                        <label className={stateStyles.formLabel}>Full Name *</label>
                        <div className={stateStyles.inputWrapper}>
                          <User size={16} className={stateStyles.inputIcon} />
                          <input
                            type="text"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className={stateStyles.formInput}
                            required
                          />
                        </div>
                      </div>

                      <div className={stateStyles.formGroup}>
                        <label className={stateStyles.formLabel}>Email Address *</label>
                        <div className={stateStyles.inputWrapper}>
                          <Mail size={16} className={stateStyles.inputIcon} />
                          <input
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className={stateStyles.formInput}
                            required
                          />
                        </div>
                      </div>

                      <div className={stateStyles.formGroup}>
                        <label className={stateStyles.formLabel}>Phone Number (with country code) *</label>
                        <div className={stateStyles.inputWrapper}>
                          <Phone size={16} className={stateStyles.inputIcon} />
                          <input
                            type="tel"
                            placeholder="+91 98XXX XXXXX"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className={stateStyles.formInput}
                            required
                          />
                        </div>
                      </div>

                      <div className={stateStyles.formGroup}>
                        <label className={stateStyles.formLabel}>Country *</label>
                        <div className={stateStyles.inputWrapper}>
                          <Globe size={16} className={stateStyles.inputIcon} />
                          <input
                            type="text"
                            placeholder="Your country"
                            value={formData.country}
                            onChange={(e) => setFormData({...formData, country: e.target.value})}
                            className={stateStyles.formInput}
                            required
                          />
                        </div>
                      </div>

                      {/* Region Dropdown */}
                      <div className={stateStyles.formGroup} ref={regionRef}>
                        <label className={stateStyles.formLabel}>Region Interested *</label>
                        <div className={stateStyles.searchableDropdown}>
                          <button
                            type="button"
                            className={stateStyles.dropdownTrigger}
                            onClick={() => setShowRegionDropdown(!showRegionDropdown)}
                          >
                            <span className={formData.region ? stateStyles.dropdownSelected : stateStyles.dropdownPlaceholder}>
                              {formData.region 
                                ? medicalTourismData.find(z => z.id === formData.region)?.name.split(":")[0] 
                                : "Select a region"}
                            </span>
                            <ChevronDown size={14} className={`${stateStyles.dropdownChevron} ${showRegionDropdown ? stateStyles.dropdownChevronOpen : ""}`} />
                          </button>
                          {showRegionDropdown && (
                            <div className={stateStyles.dropdownMenu}>
                              <div className={stateStyles.dropdownSearch}>
                                <Search size={12} />
                                <input
                                  type="text"
                                  placeholder="Search regions..."
                                  value={regionSearch}
                                  onChange={(e) => setRegionSearch(e.target.value)}
                                  className={stateStyles.dropdownSearchInput}
                                  autoFocus
                                />
                                {regionSearch && (
                                  <button type="button" className={stateStyles.dropdownSearchClear} onClick={() => setRegionSearch("")}>
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                              <div className={stateStyles.dropdownList}>
                                {filteredRegions.length > 0 ? (
                                  filteredRegions.map((zone) => (
                                    <button
                                      key={zone.id}
                                      type="button"
                                      className={`${stateStyles.dropdownItem} ${formData.region === zone.id ? stateStyles.dropdownItemActive : ""}`}
                                      onClick={() => {
                                        setFormData({...formData, region: zone.id, state: ""});
                                        setShowRegionDropdown(false);
                                        setRegionSearch("");
                                      }}
                                    >
                                      <span className={stateStyles.dropdownItemName}>{zone.name.split(":")[0]}</span>
                                      <span className={stateStyles.dropdownItemMeta}>{zone.coverage.length} states</span>
                                    </button>
                                  ))
                                ) : (
                                  <div className={stateStyles.dropdownEmpty}>No regions found</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* State Dropdown */}
                      <div className={stateStyles.formGroup} ref={stateRef}>
                        <label className={stateStyles.formLabel}>State Interested *</label>
                        <div className={stateStyles.searchableDropdown}>
                          <button
                            type="button"
                            className={`${stateStyles.dropdownTrigger} ${!formData.region ? stateStyles.dropdownTriggerDisabled : ""}`}
                            onClick={() => formData.region && setShowStateDropdown(!showStateDropdown)}
                            disabled={!formData.region}
                          >
                            <span className={formData.state ? stateStyles.dropdownSelected : stateStyles.dropdownPlaceholder}>
                              {formData.state 
                                ? availableStates.find(s => s.id === formData.state)?.name 
                                : formData.region ? "Select a state" : "Select region first"}
                            </span>
                            <ChevronDown size={14} className={`${stateStyles.dropdownChevron} ${showStateDropdown ? stateStyles.dropdownChevronOpen : ""}`} />
                          </button>
                          {showStateDropdown && formData.region && (
                            <div className={stateStyles.dropdownMenu}>
                              <div className={stateStyles.dropdownSearch}>
                                <Search size={12} />
                                <input
                                  type="text"
                                  placeholder="Search states..."
                                  value={stateSearch}
                                  onChange={(e) => setStateSearch(e.target.value)}
                                  className={stateStyles.dropdownSearchInput}
                                  autoFocus
                                />
                                {stateSearch && (
                                  <button type="button" className={stateStyles.dropdownSearchClear} onClick={() => setStateSearch("")}>
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                              <div className={stateStyles.dropdownList}>
                                {filteredStates.length > 0 ? (
                                  filteredStates.map((state) => (
                                    <button
                                      key={state.id}
                                      type="button"
                                      className={`${stateStyles.dropdownItem} ${formData.state === state.id ? stateStyles.dropdownItemActive : ""}`}
                                      onClick={() => {
                                        setFormData({...formData, state: state.id});
                                        setShowStateDropdown(false);
                                        setStateSearch("");
                                      }}
                                    >
                                      <span className={stateStyles.dropdownItemName}>{state.name}</span>
                                      <span className={stateStyles.dropdownItemMeta}>{state.startingPrice}</span>
                                    </button>
                                  ))
                                ) : (
                                  <div className={stateStyles.dropdownEmpty}>No states found</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Section 2: Treatment Requirement */}
                      <div className={stateStyles.formSectionHeader}>
                        <Stethoscope size={14} />
                        <span>Treatment Requirement</span>
                      </div>

                      <div className={stateStyles.formGroup} ref={treatmentRef}>
                        <label className={stateStyles.formLabel}>Treatment Type *</label>
                        <div className={stateStyles.searchableDropdown}>
                          <button
                            type="button"
                            className={stateStyles.dropdownTrigger}
                            onClick={() => setShowTreatmentDropdown(!showTreatmentDropdown)}
                          >
                            <span className={formData.treatmentType ? stateStyles.dropdownSelected : stateStyles.dropdownPlaceholder}>
                              {formData.treatmentType === "dental" ? "Dental" : formData.treatmentType === "aesthetic" ? "Aesthetic / Cosmetic" : "Select treatment type"}
                            </span>
                            <ChevronDown size={14} className={`${stateStyles.dropdownChevron} ${showTreatmentDropdown ? stateStyles.dropdownChevronOpen : ""}`} />
                          </button>
                          {showTreatmentDropdown && (
                            <div className={stateStyles.dropdownMenu}>
                              <div className={stateStyles.dropdownList}>
                                <button
                                  type="button"
                                  className={`${stateStyles.dropdownItem} ${formData.treatmentType === "dental" ? stateStyles.dropdownItemActive : ""}`}
                                  onClick={() => {
                                    setFormData({...formData, treatmentType: "dental", procedure: ""});
                                    setShowTreatmentDropdown(false);
                                  }}
                                >
                                  <span className={stateStyles.dropdownItemName}>Dental</span>
                                </button>
                                <button
                                  type="button"
                                  className={`${stateStyles.dropdownItem} ${formData.treatmentType === "aesthetic" ? stateStyles.dropdownItemActive : ""}`}
                                  onClick={() => {
                                    setFormData({...formData, treatmentType: "aesthetic", procedure: ""});
                                    setShowTreatmentDropdown(false);
                                  }}
                                >
                                  <span className={stateStyles.dropdownItemName}>Aesthetic / Cosmetic</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={stateStyles.formGroup} ref={procedureRef}>
                        <label className={stateStyles.formLabel}>Procedure Interested In</label>
                        <div className={stateStyles.searchableDropdown}>
                          <button
                            type="button"
                            className={`${stateStyles.dropdownTrigger} ${!formData.treatmentType ? stateStyles.dropdownTriggerDisabled : ""}`}
                            onClick={() => formData.treatmentType && setShowProcedureDropdown(!showProcedureDropdown)}
                            disabled={!formData.treatmentType}
                          >
                            <span className={formData.procedure ? stateStyles.dropdownSelected : stateStyles.dropdownPlaceholder}>
                              {formData.procedure 
                                ? {
                                    "dental-implants": "Dental Implants",
                                    "smile-design": "Smile Design",
                                    "root-canal": "Root Canal",
                                    "teeth-whitening": "Teeth Whitening",
                                    "hair-transplant": "Hair Transplant",
                                    "skin-treatment": "Skin Treatment",
                                    "cosmetic-surgery": "Cosmetic Surgery",
                                    "botox-fillers": "Botox / Fillers",
                                    "other": "Other"
                                  }[formData.procedure]
                                : formData.treatmentType ? "Select procedure" : "Select treatment type first"}
                            </span>
                            <ChevronDown size={14} className={`${stateStyles.dropdownChevron} ${showProcedureDropdown ? stateStyles.dropdownChevronOpen : ""}`} />
                          </button>
                          {showProcedureDropdown && formData.treatmentType && (
                            <div className={stateStyles.dropdownMenu}>
                              <div className={stateStyles.dropdownList}>
                                {(formData.treatmentType === "dental" 
                                  ? [
                                      { id: "dental-implants", name: "Dental Implants" },
                                      { id: "smile-design", name: "Smile Design" },
                                      { id: "root-canal", name: "Root Canal" },
                                      { id: "teeth-whitening", name: "Teeth Whitening" },
                                      { id: "other", name: "Other" }
                                    ]
                                  : [
                                      { id: "hair-transplant", name: "Hair Transplant" },
                                      { id: "skin-treatment", name: "Skin Treatment" },
                                      { id: "cosmetic-surgery", name: "Cosmetic Surgery" },
                                      { id: "botox-fillers", name: "Botox / Fillers" },
                                      { id: "other", name: "Other" }
                                    ]
                                ).map((proc) => (
                                  <button
                                    key={proc.id}
                                    type="button"
                                    className={`${stateStyles.dropdownItem} ${formData.procedure === proc.id ? stateStyles.dropdownItemActive : ""}`}
                                    onClick={() => {
                                      setFormData({...formData, procedure: proc.id});
                                      setShowProcedureDropdown(false);
                                    }}
                                  >
                                    <span className={stateStyles.dropdownItemName}>{proc.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={stateStyles.formGroup}>
                        <label className={stateStyles.formLabel}>Describe Your Concern *</label>
                        <textarea
                          placeholder="Tell us about your medical concern or what you're looking for..."
                          value={formData.concern}
                          onChange={(e) => setFormData({...formData, concern: e.target.value})}
                          className={stateStyles.formTextarea}
                          rows={3}
                          required
                        />
                      </div>

                      {/* Section 3: Medical Upload */}
                      <div className={stateStyles.formSectionHeader}>
                        <Paperclip size={14} />
                        <span>Medical Upload <span className={stateStyles.optionalBadge}>Optional</span></span>
                      </div>

                      <div className={stateStyles.formGroup}>
                        <label className={stateStyles.uploadArea}>
                          <Paperclip size={20} />
                          <span className={stateStyles.uploadText}>Upload Reports / Photos</span>
                          <span className={stateStyles.uploadHint}>X-ray, face, teeth images</span>
                          <input type="file" multiple accept="image/*,.pdf,.doc,.docx" className={stateStyles.fileInput} />
                        </label>
                      </div>

                      {/* Section 4: Travel Info */}
                      <div className={stateStyles.formSectionHeader}>
                        <Plane size={14} />
                        <span>Travel Info</span>
                      </div>

                      <div className={stateStyles.formRow}>
                        <div className={stateStyles.formGroup} ref={monthRef}>
                          <label className={stateStyles.formLabel}>Preferred Travel Month</label>
                          <div className={stateStyles.searchableDropdown}>
                            <button
                              type="button"
                              className={stateStyles.dropdownTrigger}
                              onClick={() => setShowMonthPicker(!showMonthPicker)}
                            >
                              <span className={formData.travelMonth ? stateStyles.dropdownSelected : stateStyles.dropdownPlaceholder}>
                                {formData.travelMonth 
                                  ? new Date(formData.travelMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })
                                  : "Select month"}
                              </span>
                              <ChevronDown size={14} className={`${stateStyles.dropdownChevron} ${showMonthPicker ? stateStyles.dropdownChevronOpen : ""}`} />
                            </button>
                            {showMonthPicker && (
                              <div className={stateStyles.dropdownMenu}>
                                <div className={stateStyles.dropdownList}>
                                  {Array.from({ length: 12 }, (_, i) => {
                                    const date = new Date();
                                    date.setMonth(date.getMonth() + i);
                                    const value = date.toISOString().slice(0, 7);
                                    const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                                    return (
                                      <button
                                        key={value}
                                        type="button"
                                        className={`${stateStyles.dropdownItem} ${formData.travelMonth === value ? stateStyles.dropdownItemActive : ""}`}
                                        onClick={() => {
                                          setFormData({...formData, travelMonth: value});
                                          setShowMonthPicker(false);
                                        }}
                                      >
                                        <span className={stateStyles.dropdownItemName}>{label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={stateStyles.formGroup}>
                          <label className={stateStyles.formLabel}>Number of Persons</label>
                          <div className={stateStyles.inputWrapper}>
                            <Users size={16} className={stateStyles.inputIcon} />
                            <input
                              type="number"
                              min="1"
                              placeholder="1"
                              value={formData.persons}
                              onChange={(e) => setFormData({...formData, persons: e.target.value})}
                              className={stateStyles.formInput}
                            />
                          </div>
                        </div>
                      </div>

                      <div className={stateStyles.formGroup}>
                        <label className={stateStyles.formLabel}>Preferred Contact Method</label>
                        <div className={stateStyles.radioGroup}>
                          <label className={`${stateStyles.radioOption} ${formData.contactMethod === "whatsapp" ? stateStyles.radioActive : ""}`}>
                            <input
                              type="radio"
                              name="contactMethod"
                              value="whatsapp"
                              checked={formData.contactMethod === "whatsapp"}
                              onChange={(e) => setFormData({...formData, contactMethod: e.target.value})}
                              className={stateStyles.radioInput}
                            />
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            WhatsApp
                          </label>
                          <label className={`${stateStyles.radioOption} ${formData.contactMethod === "call" ? stateStyles.radioActive : ""}`}>
                            <input
                              type="radio"
                              name="contactMethod"
                              value="call"
                              checked={formData.contactMethod === "call"}
                              onChange={(e) => setFormData({...formData, contactMethod: e.target.value})}
                              className={stateStyles.radioInput}
                            />
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.44-5.15-3.75-6.59-6.59l1.97-1.57a.98.98 0 00.25-1.01 11.36 11.36 0 01-.56-3.53c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM5.03 5h1.5c.07.88.22 1.75.45 2.58l-1.2.96C5.4 7.56 5.16 6.32 5.03 5zM19 18.97c-1.32-.09-2.59-.35-3.8-.75l1.2-1.2c.85.24 1.72.39 2.6.44v1.51zM12 3C7.46 3 3.34 4.78.29 8.67c-.18.25-.2.58-.03.84.17.26.5.37.79.25 1.18-.45 2.45-.7 3.77-.7 5.52 0 10 4.48 10 10 0 1.32-.25 2.59-.7 3.77-.12.29-.01.62.25.79.26.17.59.15.84-.03C19.22 20.66 21 16.54 21 12c0-4.97-4.03-9-9-9z"/></svg>
                            Call
                          </label>
                          <label className={`${stateStyles.radioOption} ${formData.contactMethod === "email" ? stateStyles.radioActive : ""}`}>
                            <input
                              type="radio"
                              name="contactMethod"
                              value="email"
                              checked={formData.contactMethod === "email"}
                              onChange={(e) => setFormData({...formData, contactMethod: e.target.value})}
                              className={stateStyles.radioInput}
                            />
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                            Email
                          </label>
                        </div>
                      </div>

                      {/* Section 6: Consent */}
                      <div className={stateStyles.termsCheck}>
                        <input
                          type="checkbox"
                          id="consent"
                          required
                          checked={formData.consent}
                          onChange={(e) => setFormData({...formData, consent: e.target.checked})}
                          className={stateStyles.checkbox}
                        />
                        <label htmlFor="consent" className={stateStyles.termsLabel}>
                          I agree to be contacted regarding my treatment &amp; accept the{" "}
                          <button type="button" className={stateStyles.termsLink} onClick={() => setShowTerms(true)}>Terms &amp; Conditions</button> *
                        </label>
                      </div>

                      <button type="submit" className={stateStyles.submitButton}>
                        <Send size={16} /> Get Free Consultation
                      </button>
                    </form>
                  )}

                  {/* Contact Options */}
                  <div className={stateStyles.contactOptions}>
                    <a href="tel:+919876543210" className={stateStyles.contactButton}>
                      <Phone size={16} /> Call
                    </a>
                    <a href="https://wa.me/919876543210" className={`${stateStyles.contactButton} ${stateStyles.whatsappButton}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Terms & Conditions Modal */}
      {showTerms && (
        <div className={stateStyles.modalOverlay} onClick={() => setShowTerms(false)}>
          <div className={stateStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={stateStyles.modalHeader}>
              <h3>Terms &amp; Conditions</h3>
              <button className={stateStyles.modalClose} onClick={() => setShowTerms(false)}>&times;</button>
            </div>
            <div className={stateStyles.modalBody}>
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
            <div className={stateStyles.modalFooter}>
              <button
                className={stateStyles.modalAcceptBtn}
                onClick={() => {
                  setFormData({ ...formData, consent: true });
                  setShowTerms(false);
                }}
              >
                <Check size={14} /> I Accept
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

// ── Zone Detail View ─────────────────────────────────────────────────────
function ZoneDetailView({ zone }: { zone: any }) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<string>("");

  const openBookingModal = (stateId?: string) => {
    setSelectedState(stateId || "");
    setIsBookingModalOpen(true);
  };



  return (
    <>
      <Navbar />
      <main className={zoneStyles.page}>
        {/* ── About-style Hero Section ── */}
        <div className="container">
          <section className={zoneStyles.heroSection}>
            <Image
              src={zone.image}
              alt={zone.name}
              fill
              className={zoneStyles.heroBackground}
              priority
            />
            <div className={zoneStyles.heroOverlay} />
            <div className={zoneStyles.heroInner}>
              <motion.div
                className={zoneStyles.heroContent}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <motion.div
                  className={zoneStyles.heroBreadcrumb}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <Link href="/treatments/medical-tourism" className={zoneStyles.heroBackLink}>
                    <ChevronLeft size={16} /> Back to Medical Tourism
                  </Link>
                </motion.div>
                <motion.h1
                  className={zoneStyles.heroHeading}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {zone.name.includes(':') ? (
                    <>
                      {zone.name.split(':')[0]}:<br />
                      <span className={zoneStyles.heroSubHeading}>{zone.name.split(':')[1]}</span>
                    </>
                  ) : zone.name}
                </motion.h1>
                <motion.p
                  className={zoneStyles.heroDescription}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  {zone.shortDescription}
                </motion.p>
              </motion.div>


            </div>
          </section>
        </div>

        {/* ── About Region Section ── */}
        <section className={zoneStyles.aboutSection}>
          <div className="container">
            <div className={zoneStyles.aboutGrid}>
              <motion.div
                className={zoneStyles.aboutContent}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className={zoneStyles.aboutTitle}>
                  About <span className={zoneStyles.accent}>{zone.name.split(":")[0]}</span>
                </h2>
                <p className={zoneStyles.aboutDescription}>
                  {zone.shortDescription} This circuit covers the beautiful regions of {zone.coverage.join(", ")}, offering a perfect blend of medical excellence and cultural exploration.
                </p>
                <p className={zoneStyles.aboutDescription}>
                  Our curated medical tourism packages in this region start from <strong>{zone.startingPackage}</strong>, including premium accommodation, private transfers, dedicated medical assistance, and comprehensive travel insurance.
                </p>
                <div className={zoneStyles.vibeTags}>
                  {zone.vibeTags.map((tag: string) => (
                    <span key={tag} className={zoneStyles.vibeTag}>{tag}</span>
                  ))}
                </div>

                <div className={zoneStyles.aboutHighlightsGrid}>
                  {zone.highlights.map((highlight: string, idx: number) => (
                    <div key={highlight} className={zoneStyles.highlightCard}>
                      <div className={zoneStyles.highlightNumber}>{idx + 1}</div>
                      <div className={zoneStyles.highlightInfo}>
                        <p className={zoneStyles.highlightText}>{highlight}</p>
                      </div>
                    </div>
                  ))}
                  <div className={zoneStyles.coverageBadge}>
                    <MapPin size={18} />
                    <div>
                      <span className={zoneStyles.coverageLabel}>Coverage Area</span>
                      <span className={zoneStyles.coverageValue}>{zone.coverage.length} States & Regions</span>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                className={zoneStyles.aboutImageWrapper}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Image
                  src={`/images/medical-tourism/about-${zone.id}.png`}
                  alt={`About ${zone.name.split(":")[0]}`}
                  fill
                  className={zoneStyles.aboutRegionImage}
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── State Cards Section ── */}
        <section className={zoneStyles.coverageSection}>
          <div className="container">
            <div className={zoneStyles.coverageHeader}>
              <h2 className="section-title">Destinations in <span className={zoneStyles.accent}>{zone.name.split(":")[0]}</span></h2>
              <p className="section-subtitle">Explore our carefully curated destinations across {zone.coverage.join(", ")}</p>
            </div>
            <div className={zoneStyles.statesGrid}>
              {zone.states.map((state: any, idx: number) => (
                <motion.div key={state.id} className={zoneStyles.stateCard} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
                  <div className={zoneStyles.stateImageContainer}>
                    <Image src={state.image} alt={state.name} fill className={zoneStyles.stateImage} onError={(e: any) => { e.target.src = "https://images.unsplash.com/photo-1548013146-72479768bbaa?q=80&w=2070&auto=format&fit=crop"; }} />
                    <div className={zoneStyles.stateBadge}><Star size={12} /> Featured</div>
                  </div>
                  <div className={zoneStyles.stateContent}>
                    <div className={zoneStyles.stateHeader}>
                      <h3 className={zoneStyles.stateName}>{state.name}</h3>
                      <p className={zoneStyles.stateTagline}>{state.tagline}</p>
                    </div>
                    <p className={zoneStyles.stateDescription}>{state.experience}</p>
                    <div className={zoneStyles.keyInfo}>
                      <div className={zoneStyles.keyInfoItem}><Clock size={14} /><span>{state.duration}</span></div>
                      <div className={zoneStyles.keyInfoItem}><IndianRupee size={14} /><span>{state.startingPrice}</span></div>
                    </div>
                    <div className={zoneStyles.includesSection}>
                      <h4 className={zoneStyles.includesLabel}>Package Includes:</h4>
                      <div className={zoneStyles.includesList}>
                        {state.includes.slice(0, 4).map((item: string) => (
                          <span key={item} className={zoneStyles.includeItem}><CheckCircle2 size={12} /> {item}</span>
                        ))}
                      </div>
                    </div>
                    <div className={zoneStyles.stateActions}>
                      <Link href={`/treatments/medical-tourism/${state.id}`} className={zoneStyles.viewDetailsBtn}>View Details <ArrowRight size={14} /></Link>
                      <button onClick={() => openBookingModal(state.id)} className={zoneStyles.bookBtn}>Book Now</button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Section ── */}
        <section className={zoneStyles.ctaSection}>
          <div className="container">
            <div className={zoneStyles.ctaCard}>
              <div className={zoneStyles.ctaContent}>
                <h3>Ready to Start Your Medical Journey?</h3>
                <p>Contact our team for personalized medical tourism packages tailored to your needs.</p>
                <div className={zoneStyles.ctaButtons}>
                  <button onClick={() => openBookingModal()} className={zoneStyles.ctaPrimaryBtn}><Calendar size={16} /> Schedule Consultation</button>
                  <Link href="/contact" className={zoneStyles.ctaSecondaryBtn}><Phone size={16} /> Contact Us</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BookingModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} preSelectedZone={zone.id} preSelectedState={selectedState} />
      <Footer />
    </>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────
export default function MedicalTourismSlugPage() {
  const { slug } = useParams();
  const resolved = resolve(slug as string);

  if (resolved.type === "zone") return <ZoneDetailView zone={resolved.zone} />;
  if (resolved.type === "state") return <StateDetailView selectedState={resolved.state!} />;

  return (
    <>
      <Navbar />
      <div style={{ padding: "100px 0", textAlign: "center" }}>
        <h2>Page Not Found</h2>
        <Link href="/treatments/medical-tourism">Back to Medical Tourism</Link>
      </div>
      <Footer />
    </>
  );
}

// Simple helper component for icons
function Sparkles({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/>
      <path d="M19 17v4"/>
      <path d="M3 5h4"/>
      <path d="M17 19h4"/>
    </svg>
  );
}
