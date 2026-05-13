"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  MessageSquare, Send, X, Bot, User, Loader2,
  Mic, MicOff, Volume2, VolumeX, PhoneCall, Sparkles, CalendarPlus,
} from "lucide-react";
import styles from "./ai-chatbot.module.css";
import { useAppointment } from "./AppointmentProvider";

/* ─── Types ─── */
interface Message { role: "user" | "bot"; content: string; time?: string; }
interface Dept    { id: string; name: string; }
interface Doc     { id: string; name: string; specialization?: string; departmentId?: string; }

type BookingStep =
  | "idle" | "name" | "phone" | "email"
  | "dept" | "doctor" | "date" | "time" | "confirm";

interface BookingData {
  hospitalId: string;
  name: string; phone: string; email: string;
  departmentId: string; departmentName: string;
  doctorId: string; doctorName: string;
  date: string; timeSlot: string;
}

/* ─── Helpers ─── */
function fmt() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function toLocalDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

/* ─── Strip emojis + markdown for clean TTS audio ─── */
function cleanForSpeech(raw: string): string {
  return raw
    /* markdown */
    .replace(/\*\*/g, "").replace(/[*_#`~]/g, "").replace(/\[[^\]]*\]/g, "").replace(/\([^)]*\)/g, "")
    /* URLs */
    .replace(/https?:\/\/\S+/g, "")
    /* bullet / list markers */
    .replace(/^[\s]*[-•‣◦*]\s/gm, "")
    /* emoji: emoticons, symbols, pictographs, transport, flags, dingbats */
    .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
    .replace(/[\u{1F700}-\u{1F77F}]/gu, "")
    .replace(/[\u{1F780}-\u{1F7FF}]/gu, "")
    .replace(/[\u{1F800}-\u{1F8FF}]/gu, "")
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, "")
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, "")
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, "")
    .replace(/[\u{2600}-\u{26FF}]/gu, "")
    .replace(/[\u{2700}-\u{27BF}]/gu, "")
    .replace(/[\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "")
    /* numbered list prefixes like "1." "2." */
    .replace(/^\d+\.\s/gm, "")
    /* newlines → short pause */
    .replace(/\n+/g, ". ")
    .replace(/\.\s*\./g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/* ─── Nav intent detector (broad voice-friendly patterns) ─── */
function detectNav(msg: string): { type: "go"; path: string } | { type: "modal"; modal: "appointment" } | null {
  const m = msg.toLowerCase().trim();
  if (/(contact|reach us|call us|get in touch|where are you|your address|location)/.test(m)) return { type: "go", path: "/contact" };
  if (/(who (are|is) (you|we)|our team|your team|about us|about the clinic|about celeb|tell me about you)/.test(m) || /^about( us)?$/.test(m)) return { type: "go", path: "/about" };
  if (/(treatment|services|speciality|specialty|what do you (offer|treat|do))/.test(m) && /(list|show|see|all|page|view|what|tell)/.test(m)) return { type: "go", path: "/treatments" };
  if (/(\bhome\b|main page|back to home|take me home|go back|go home)/.test(m)) return { type: "go", path: "/" };
  if (/(open|show|launch|fill).*(form|modal|appointment|booking)/.test(m)) return { type: "modal", modal: "appointment" };
  if (/^(open form|show form|appointment form|open booking|show booking)$/.test(m)) return { type: "modal", modal: "appointment" };
  return null;
}

/* ─── Normalize spoken email (voice dictation fix) ─── */
function normalizeSpokenEmail(spoken: string): string {
  let s = spoken.toLowerCase().trim();
  // "at the rate of" / "at the rate" / standalone "at" → @
  s = s.replace(/\bat\s+the\s+rate\s+of\b/g, "@")
       .replace(/\bat\s+the\s+rate\b/g, "@")
       .replace(/(?<=\S)\s+at\s+(?=\S)/g, "@")
       .replace(/\s+at\s+/g, "@");
  // "dot" → .
  s = s.replace(/\bdot\b/g, ".");
  // if still no @, detect known domain and insert @
  if (!s.includes("@")) {
    const domains = ["gmail", "yahoo", "hotmail", "outlook", "icloud", "live", "rediff", "ymail"];
    for (const d of domains) {
      const idx = s.indexOf(d);
      if (idx > 0) {
        const user = s.slice(0, idx).replace(/\s+/g, "").replace(/[^a-z0-9._+\-]/g, "");
        const rest = s.slice(idx).replace(/\s+/g, "");
        s = user + "@" + rest;
        break;
      }
    }
  }
  // strip spaces inside the email
  if (s.includes("@")) {
    const at = s.indexOf("@");
    const user = s.slice(0, at).replace(/\s+/g, "");
    const domain = s.slice(at + 1).replace(/\s+/g, "");
    s = user + "@" + domain;
  }
  // fix missing dot before tld: "gmail com" → "gmail.com"
  s = s.replace(/([a-z])\s+(com|net|org|in|io|co)$/g, "$1.$2");
  return s;
}

/* ─── Booking intent detector (broad voice-friendly) ─── */
function isBookingIntent(msg: string) {
  const m = msg.toLowerCase().trim();
  return /\b(book|schedule|make|fix|set up|i want|i'd like|i need|can i|how to|want to|need to|would like to).*(appointment|consultation|visit|slot|session|doctor|meet)\b/.test(m)
    || /\b(appointment|consultation|doctor).*(book|schedule|make|fix|available|want|need)\b/.test(m)
    || /\b(need|want|see).*(doctor|physician|specialist|appointment)\b/.test(m)
    || /^(book|appointment|consult|doctor|see a doctor|meet doctor|visit doctor)$/.test(m);
}

/* ─── BotMessage renderer ─── */
function BotMessage({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        const isBullet = /^[•\-\*]/.test(line.trim()) || /^\d+\./.test(line.trim());
        const segs = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} style={{ margin: isBullet ? "2px 0" : "4px 0", paddingLeft: isBullet ? 4 : 0 }}>
            {segs.map((s, j) =>
              s.startsWith("**") && s.endsWith("**") ? <strong key={j}>{s.slice(2,-2)}</strong> : s
            )}
          </p>
        );
      })}
    </>
  );
}

const SUGGESTIONS = [
  "Book an appointment",
  "What treatments do you offer?",
  "Hair loss treatments",
  "Take me to contact page",
  "Medical Tourism info",
];

/* ═══════════════════════════════════════════════════════ */
export default function AIChatbot() {
  const { openAppointment } = useAppointment();
  const router   = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen]     = useState(false);
  const [input, setInput]       = useState("");
  const [messages, setMessages] = useState<Message[]>([{
    role: "bot",
    content: "Hello! 👋 I'm your **AI Health Assistant** for MediNex+.\n\nI can help you with:\n• Appointment bookings\n• Navigate to any page\n• Doctor & department info\n• Platform support\n\nHow can I assist you today?",
    time: fmt(),
  }]);
  const [loading, setLoading]     = useState(false);
  const [recording, setRecording] = useState(false);
  const [ttsOn, setTtsOn]         = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const [voiceMode, setVoiceMode]     = useState(false);
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const voiceModeRef = useRef(false);

  /* ── Booking wizard state ── */
  const [bStep, setBStep] = useState<BookingStep>("idle");
  const [bData, setBData] = useState<Partial<BookingData>>({});
  const [depts, setDepts] = useState<Dept[]>([]);
  const [docs,  setDocs]  = useState<Doc[]>([]);
  const [slots, setSlots] = useState<string[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const recognRef = useRef<any>(null);
  const synthRef  = useRef<SpeechSynthesis | null>(null);
  /* keep ref in sync for closures inside booking handlers */
  const bDataRef = useRef<Partial<BookingData>>({});
  useEffect(() => { bDataRef.current = bData; }, [bData]);
  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);

  /* restart mic after Next.js client-side navigation (recognition gets aborted by browser) */
  useEffect(() => {
    if (!voiceModeRef.current) return;
    recognRef.current?.stop();
    const t = setTimeout(() => {
      if (voiceModeRef.current && !isSpeakRef.current) startListening();
    }, 1200);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (typeof window !== "undefined") synthRef.current = window.speechSynthesis;
    return () => { synthRef.current?.cancel(); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) { setShowBadge(false); setTimeout(() => inputRef.current?.focus(), 320); }
  }, [isOpen]);

  /* ── TTS queue refs ── */
  const sendRef      = useRef<(msg: string) => void>(() => {});
  const speakQRef    = useRef<string[]>([]);
  const isSpeakRef   = useRef(false);
  const flushRef     = useRef<() => void>(() => {});
  const voicesRef    = useRef<SpeechSynthesisVoice[]>([]);
  const hadFinalRef  = useRef(false);   /* did last recognition session produce a final result? */

  /* Load voices (Chrome fires voiceschanged asynchronously) */
  useEffect(() => {
    const load = () => { voicesRef.current = window.speechSynthesis?.getVoices() ?? []; };
    load();
    window.speechSynthesis?.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", load);
  }, []);

  const getIndianVoice = () => {
    const vs = voicesRef.current;
    return vs.find(v => v.lang === "en-IN" && /female|woman/i.test(v.name))
        || vs.find(v => v.lang === "en-IN")
        || vs.find(v => /ravi|veena|india|hindi/i.test(v.name))
        || null;
  };

  /* ── TTS queue flush (render-time updated via flushRef) ── */
  const flush = () => {
    if (isSpeakRef.current || !synthRef.current) return;
    if (speakQRef.current.length === 0) {
      /* queue empty — restart mic after small pause */
      if (voiceModeRef.current) setTimeout(() => { if (voiceModeRef.current && !isSpeakRef.current) startListening(); }, 550);
      return;
    }
    const rawText = speakQRef.current.shift()!;
    const text = cleanForSpeech(rawText);
    if (!text) { flushRef.current(); return; }
    isSpeakRef.current = true;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang   = "en-IN";
    utt.rate   = 0.88;
    utt.pitch  = 1.0;
    utt.volume = 1.0;
    const iv = getIndianVoice();
    if (iv) utt.voice = iv;
    setIsSpeaking(true);
    const done = () => { isSpeakRef.current = false; setIsSpeaking(false); flushRef.current(); };
    utt.onend  = done;
    utt.onerror = done;
    synthRef.current.speak(utt);
  };
  flushRef.current = flush;

  /* Queue a string to be spoken (no-op if TTS+voice both off) */
  const queueSpeak = useCallback((text: string) => {
    if (!ttsOn && !voiceModeRef.current) return;
    speakQRef.current.push(text);
    if (!isSpeakRef.current) flushRef.current();
  }, [ttsOn]);

  /* ── addBot — adds message + queues TTS ── */
  const addBot = useCallback((content: string) => {
    setMessages(prev => [...prev, { role: "bot", content, time: fmt() }]);
    queueSpeak(content);
  }, [queueSpeak]);

  /* ── startListening — guarded: won't fire while bot is speaking ── */
  const startListening = useCallback(() => {
    if (isSpeakRef.current) return;           /* bot speaking — wait for queue drain */
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    try { recognRef.current?.stop(); } catch { /* ignore */ }
    hadFinalRef.current = false;              /* reset for this new session */
    const rec = new SR();
    rec.lang            = "en-IN";
    rec.continuous      = false;
    rec.interimResults  = true;
    rec.onstart  = () => setRecording(true);
    rec.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setInput(t);
      if (e.results[e.results.length - 1].isFinal) {
        hadFinalRef.current = true;           /* user spoke — normal end expected */
        setRecording(false);
        setInput("");
        sendRef.current(t);
      }
    };
    rec.onerror = (e: any) => {
      setRecording(false);
      /* restart for ALL error types when in voice mode and bot is silent */
      if (voiceModeRef.current && !isSpeakRef.current && e.error !== "not-allowed") {
        const delay = e.error === "no-speech" ? 600 : 1000;
        setTimeout(() => { if (voiceModeRef.current && !isSpeakRef.current) startListening(); }, delay);
      }
    };
    rec.onend = () => {
      setRecording(false);
      /* if recognition ended WITHOUT a final result (aborted by nav, unexpected stop)
         and we are in voice mode and bot is not speaking → restart */
      if (!hadFinalRef.current && voiceModeRef.current && !isSpeakRef.current) {
        setTimeout(() => { if (voiceModeRef.current && !isSpeakRef.current) startListening(); }, 700);
      }
    };
    recognRef.current = rec;
    try { rec.start(); } catch { /* already started */ }
  }, []);

  const resetBooking = () => { setBStep("idle"); setBData({}); setDepts([]); setDocs([]); setSlots([]); };

  /* ── Booking wizard: start ── */
  const startBooking = async () => {
    setBStep("name");
    setBData({});
    try {
      const r = await fetch("/api/public/booking", { credentials: "include" });
      const d = await r.json();
      const hid: string = d.data?.hospital?.id || "";
      setBData(prev => ({ ...prev, hospitalId: hid }));
      bDataRef.current = { ...bDataRef.current, hospitalId: hid };
      setDepts(d.data?.departments || []);
    } catch { /* continue without pre-loading */ }
    addBot("Great! I'll book an appointment for you right now. 📋\n\n**Step 1 of 6 — What is your full name?**");
  };

  /* ── Booking wizard: process each step ── */
  const handleBookingStep = async (val: string) => {
    const v = val.trim();
    if (!v) return;

    switch (bStep) {

      case "name": {
        setBData(prev => ({ ...prev, name: v }));
        bDataRef.current = { ...bDataRef.current, name: v };
        setBStep("phone");
        addBot(`Nice to meet you **${v}**! 😊\n\n**Step 2 of 6 — What is your mobile number?** (10-digit)`);
        break;
      }

      case "phone": {
        const clean = v.replace(/\D/g, "");
        if (!/^[6-9]\d{9}$/.test(clean)) {
          addBot("⚠️ Please enter a valid **10-digit Indian mobile number**.\n\nExample: 9876543210");
          return;
        }
        setBData(prev => ({ ...prev, phone: clean }));
        bDataRef.current = { ...bDataRef.current, phone: clean };
        setBStep("email");
        addBot("**Step 3 of 6 — What is your email address?**\n\n_(Used to send booking confirmation)_");
        break;
      }

      case "email": {
        const normalizedEmail = normalizeSpokenEmail(v);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
          addBot(`⚠️ I couldn't parse a valid email from: "${v}"\n\nPlease say it clearly as:\n• \'yourname **at** gmail **dot** com\'\n\nOr type it directly.`);
          return;
        }
        const emailToUse = normalizedEmail;
        setBData(prev => ({ ...prev, email: emailToUse }));
        bDataRef.current = { ...bDataRef.current, email: emailToUse };
        setBStep("dept");
        addBot(`Got it! Email saved as **${emailToUse}** ✅`);
        if (depts.length === 0) {
          /* lazy load if not already fetched */
          try {
            const r = await fetch("/api/public/booking", { credentials: "include" });
            const d = await r.json();
            const hid: string = d.data?.hospital?.id || bDataRef.current.hospitalId || "";
            setBData(prev => ({ ...prev, hospitalId: hid }));
            bDataRef.current = { ...bDataRef.current, hospitalId: hid };
            setDepts(d.data?.departments || []);
            const list = (d.data?.departments as Dept[] || []).map((dep, i) => `${i+1}. ${dep.name}`).join("\n");
            addBot(`**Step 4 of 6 — Which department?**\n\n${list}\n\n_(Type the number or name)_`);
          } catch {
            addBot("Could not load departments. Please try again or call **+91 90590 53938**.");
            resetBooking();
          }
        } else {
          const list = depts.map((dep, i) => `${i+1}. ${dep.name}`).join("\n");
          addBot(`**Step 4 of 6 — Which department?**\n\n${list}\n\n_(Type the number or name)_`);
        }
        break;
      }

      case "dept": {
        const idx = parseInt(v) - 1;
        const dept = !isNaN(idx) && depts[idx]
          ? depts[idx]
          : depts.find(d => d.name.toLowerCase().includes(v.toLowerCase()));
        if (!dept) {
          addBot("⚠️ Department not found. Please type the **number** or **name** from the list above.");
          return;
        }
        setBData(prev => ({ ...prev, departmentId: dept.id, departmentName: dept.name }));
        bDataRef.current = { ...bDataRef.current, departmentId: dept.id, departmentName: dept.name };
        setBStep("doctor");
        try {
          const hid = bDataRef.current.hospitalId || "";
          const r = await fetch(`/api/public/booking/doctors?hid=${hid}`, { credentials: "include" });
          const d = await r.json();
          const all: Doc[] = d.data || [];
          const filtered = all.filter(doc => doc.departmentId === dept.id);
          const list = filtered.length ? filtered : all;
          setDocs(list);
          const docStr = list.map((doc, i) => `${i+1}. **${doc.name}**${doc.specialization ? ` — ${doc.specialization}` : ""}`).join("\n");
          addBot(`**Step 5 of 6 — Which doctor?**\n\n${docStr}\n\n_(Type the number or doctor name)_`);
        } catch {
          addBot("Could not load doctors. Please try again or call **+91 90590 53938**.");
          resetBooking();
        }
        break;
      }

      case "doctor": {
        const idx = parseInt(v) - 1;
        const doc = !isNaN(idx) && docs[idx]
          ? docs[idx]
          : docs.find(d => d.name.toLowerCase().includes(v.toLowerCase()));
        if (!doc) {
          addBot("⚠️ Doctor not found. Please type the **number** or **name** from the list above.");
          return;
        }
        setBData(prev => ({ ...prev, doctorId: doc.id, doctorName: doc.name }));
        bDataRef.current = { ...bDataRef.current, doctorId: doc.id, doctorName: doc.name };
        setBStep("date");
        const today = toLocalDate(new Date());
        const tmrw  = toLocalDate(new Date(Date.now() + 86400000));
        addBot(`**Step 6 of 6 — What date?**\n\n• Today: **${today}**\n• Tomorrow: **${tmrw}**\n\nOr type any future date in **YYYY-MM-DD** format.`);
        break;
      }

      case "date": {
        const today = toLocalDate(new Date());
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || v < today) {
          addBot("⚠️ Please enter a **valid future date** in YYYY-MM-DD format.\n\nExample: " + today);
          return;
        }
        setBData(prev => ({ ...prev, date: v }));
        bDataRef.current = { ...bDataRef.current, date: v };
        setBStep("time");
        setLoading(true);
        try {
          const hid = bDataRef.current.hospitalId || "";
          const did = bDataRef.current.doctorId || "";
          const r = await fetch(`/api/public/booking/slots?hid=${hid}&doctorId=${did}&date=${v}`, { credentials: "include" });
          const d = await r.json();
          const booked: string[] = d.data?.bookedSlots || [];
          const available: string[] = (d.data?.allSlots || d.data?.slots || []).filter((s: string) => !booked.includes(s));
          setSlots(available);
          if (available.length === 0) {
            addBot("⚠️ No available slots for that date. Please try a **different date** (YYYY-MM-DD).");
            setBStep("date");
          } else {
            const slotStr = available.map((s, i) => `${i+1}. ${fmt12(s)}`).join("  |  ");
            addBot(`✅ **Available time slots for ${v}:**\n\n${slotStr}\n\n_(Type the number or time)_`);
          }
        } catch {
          addBot("Could not load time slots. Please try again or call **+91 90590 53938**.");
          resetBooking();
        } finally {
          setLoading(false);
        }
        break;
      }

      case "time": {
        const idx = parseInt(v) - 1;
        const slot = !isNaN(idx) && slots[idx]
          ? slots[idx]
          : slots.find(s => s === v || fmt12(s).toLowerCase() === v.toLowerCase());
        if (!slot) {
          addBot("⚠️ Please select a valid slot **number** from the list above.");
          return;
        }
        setBData(prev => ({ ...prev, timeSlot: slot }));
        bDataRef.current = { ...bDataRef.current, timeSlot: slot };
        setBStep("confirm");
        const bd = bDataRef.current;
        addBot(
          `📋 **Appointment Summary**\n\n` +
          `• **Name:** ${bd.name}\n` +
          `• **Phone:** ${bd.phone}\n` +
          `• **Email:** ${bd.email}\n` +
          `• **Department:** ${bd.departmentName}\n` +
          `• **Doctor:** ${bd.doctorName}\n` +
          `• **Date:** ${bd.date}\n` +
          `• **Time:** ${fmt12(slot)}\n\n` +
          `Reply **yes** to confirm or **no** to cancel.`
        );
        break;
      }

      case "confirm": {
        if (/^(yes|y|confirm|ok|sure|book|proceed|go ahead)/i.test(v)) {
          setLoading(true);
          try {
            const bd = bDataRef.current;
            const res = await fetch("/api/public/booking", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                hospitalId: bd.hospitalId,
                name: bd.name, phone: bd.phone, email: bd.email,
                doctorId: bd.doctorId, departmentId: bd.departmentId,
                appointmentDate: bd.date, timeSlot: bd.timeSlot,
                type: "OPD",
              }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
              const token = data.data?.appointment?.tokenNumber;
              addBot(
                `🎉 **Appointment Booked Successfully!**\n\n` +
                `${token ? `• **Token #:** ${token}\n` : ""}` +
                `• **Doctor:** ${bd.doctorName}\n` +
                `• **Date:** ${bd.date}\n` +
                `• **Time:** ${fmt12(bd.timeSlot!)}\n\n` +
                `A confirmation has been sent to **${bd.email}**.\n\nSee you soon at MediNex+! 🏥`
              );
            } else {
              addBot(`❌ Booking failed: ${data.message || "Please try again."}\n\nOr call us at **+91 90590 53938**.`);
            }
          } catch {
            addBot("❌ Network error during booking. Please call **+91 90590 53938**.");
          } finally {
            setLoading(false);
            resetBooking();
          }
        } else {
          addBot("Booking cancelled. 👍 Let me know if there's anything else I can help with!");
          resetBooking();
        }
        break;
      }
    }
  };

  /* ── Main send handler ── */
  const send = async (override?: string) => {
    const msg = (override ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg, time: fmt() }]);

    /* 1️⃣ Booking wizard in progress */
    if (bStep !== "idle") {
      await handleBookingStep(msg);
      return;
    }

    /* 2️⃣ Navigation intent */
    const nav = detectNav(msg);
    if (nav) {
      if (nav.type === "go") {
        const label = nav.path === "/" ? "Home" : nav.path.slice(1).charAt(0).toUpperCase() + nav.path.slice(2);
        addBot(`Sure! Redirecting you to the ${label} page now.`);
        /* navigate after enough time for TTS to finish */
        const delay = voiceModeRef.current ? 2800 : 700;
        setTimeout(() => { if (!voiceModeRef.current) setIsOpen(false); router.push(nav.path); }, delay);
      } else {
        addBot("Opening the appointment booking form for you!");
        const delay = voiceModeRef.current ? 2500 : 500;
        setTimeout(() => { if (!voiceModeRef.current) setIsOpen(false); openAppointment(); }, delay);
      }
      return;
    }

    /* 3️⃣ Booking intent → start wizard */
    if (isBookingIntent(msg)) {
      await startBooking();
      return;
    }

    /* 4️⃣ Normal AI chat */
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: messages.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      const reply = data.text || data.error || "I'm having trouble connecting. Please try again.";
      addBot(reply);
    } catch {
      addBot("I'm having trouble connecting right now. Please call us at **+91 90590 53938**.");
    } finally {
      setLoading(false);
    }
  };

  /* render-time ref update — always points to latest closures */
  sendRef.current  = send;
  flushRef.current = flush;

  /* ── Voice mode toggle ── */
  const toggleVoiceMode = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Voice input needs Chrome or Edge browser."); return; }
    if (voiceMode) {
      recognRef.current?.stop();
      synthRef.current?.cancel();
      speakQRef.current  = [];
      isSpeakRef.current = false;
      setIsSpeaking(false);
      setVoiceMode(false);
      voiceModeRef.current = false;
      setRecording(false);
      setTtsOn(false);
    } else {
      speakQRef.current  = [];
      isSpeakRef.current = false;
      setVoiceMode(true);
      voiceModeRef.current = true;
      setTtsOn(true);
      /* greet then start listening */
      const greet = "Voice mode activated. I'm listening. How can I help you?";
      speakQRef.current.push(greet);
      flushRef.current();
    }
  };
  const stopVoice = () => {
    recognRef.current?.stop();
    synthRef.current?.cancel();
    speakQRef.current  = [];
    isSpeakRef.current = false;
    setIsSpeaking(false);
    setRecording(false);
    if (voiceMode) { setVoiceMode(false); voiceModeRef.current = false; setTtsOn(false); }
  };

  const showSuggestions = messages.length <= 1 && !loading;

  /* ── Step progress indicator ── */
  const STEP_LABELS: Partial<Record<BookingStep, string>> = {
    name: "1/6 Name", phone: "2/6 Phone", email: "3/6 Email",
    dept: "4/6 Dept", doctor: "5/6 Doctor", date: "6/6 Date", time: "6/6 Time", confirm: "Confirm",
  };

  const isPublicPage = pathname === "/" || pathname?.match(/^\/(login|signup|about|blog|contact|treatments|privacy-policy|terms-of-service|cookie-policy)/);
  const isDashboard = pathname?.match(/^\/(administrative|clinical|diagnostic|doctor|finance|hospitaladmin|nursingadmin|parentdept|receptionist|staff|subdept|superadmin|support)/);
  if (isPublicPage || isDashboard) return null;

  return (
    <div className={styles.container}>

      {isOpen && (
        <div className={styles.chatWindow}>

          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.botAvatar}>
                <Sparkles size={15} />
                <span className={styles.onlineDot} />
              </div>
              <div>
                <div className={styles.headerTitle}>AI Health Assistant</div>
                <div className={styles.headerStatus}>
                  <span className={styles.statusDot} />
                  {voiceMode
                    ? isSpeaking
                      ? <span style={{ color: "#60a5fa", fontWeight: 700 }}>🔊 Speaking...</span>
                      : recording
                        ? <span style={{ color: "#f87171", fontWeight: 700 }}>🎤 Listening...</span>
                        : <span style={{ color: "#fbbf24", fontWeight: 700 }}>🎤 Voice Mode · Ready</span>
                    : bStep !== "idle"
                      ? <span style={{ color: "#86efac", fontWeight: 700 }}>Booking · {STEP_LABELS[bStep]}</span>
                      : "Online · MediNex+"}
                </div>
              </div>
            </div>
            <div className={styles.headerActions}>
              {bStep !== "idle" && (
                <button className={styles.hBtn} title="Cancel booking" onClick={() => { resetBooking(); addBot("Booking cancelled. How else can I help?"); }}>
                  <X size={12} />
                </button>
              )}
              <a href="tel:+919059053938" className={styles.hBtn} title="Call us"><PhoneCall size={13} /></a>
              <button onClick={() => { setTtsOn(v => !v); synthRef.current?.cancel(); }} className={styles.hBtn} title={ttsOn ? "Mute" : "Speak"}>
                {ttsOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </button>
              <button className={styles.hBtn} onClick={() => setIsOpen(false)}><X size={13} /></button>
            </div>
          </div>

          {/* Messages */}
          <div className={styles.messagesArea} ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`${styles.row} ${m.role === "user" ? styles.userRow : styles.botRow}`}>
                {m.role === "bot" && <div className={styles.avatar}><Bot size={12} /></div>}
                <div className={styles.msgCol}>
                  <div className={`${styles.bubble} ${m.role === "user" ? styles.userBubble : styles.botBubble}`}>
                    {m.role === "bot" ? <BotMessage text={m.content} /> : m.content}
                  </div>
                  {m.time && <div className={styles.msgTime}>{m.time}</div>}
                  {m.role === "bot" && i > 0 && bStep === "idle" && (
                    <div className={styles.msgActions}>
                      <a href="tel:+919059053938" className={`${styles.msgActionBtn} ${styles.msgActionCall}`}>
                        <PhoneCall size={11} /> Call Now
                      </a>
                      <button
                        onClick={() => { setIsOpen(false); setTimeout(openAppointment, 120); }}
                        className={`${styles.msgActionBtn} ${styles.msgActionBook}`}
                      >
                        <CalendarPlus size={11} /> Book Appointment
                      </button>
                    </div>
                  )}
                </div>
                {m.role === "user" && <div className={`${styles.avatar} ${styles.userAvatar}`}><User size={12} /></div>}
              </div>
            ))}

            {loading && (
              <div className={`${styles.row} ${styles.botRow}`}>
                <div className={styles.avatar}><Bot size={12} /></div>
                <div className={styles.typingBubble}><span /><span /><span /></div>
              </div>
            )}
          </div>

          {/* Quick suggestions */}
          {showSuggestions && !loading && (
            <div className={styles.suggestions}>
              {SUGGESTIONS.map(s => (
                <button key={s} className={styles.chip} onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div className={styles.inputBar}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={
                isSpeaking  ? "🔊 Bot is speaking..." :
                recording   ? "🎤 Listening... speak now" :
                bStep === "name"    ? "Enter your full name..." :
                bStep === "phone"   ? "Enter 10-digit mobile..." :
                bStep === "email"   ? "Enter email address..." :
                bStep === "dept"    ? "Type number or dept name..." :
                bStep === "doctor"  ? "Type number or doctor name..." :
                bStep === "date"    ? "YYYY-MM-DD format..." :
                bStep === "time"    ? "Type slot number..." :
                bStep === "confirm" ? "yes / no" :
                voiceMode ? "Voice mode active — speak or type..." :
                "Ask anything or say 'book appointment'..."
              }
              className={`${styles.input} ${recording ? styles.inputLive : ""} ${isSpeaking ? styles.inputSpeaking : ""}`}
              disabled={loading || isSpeaking}
            />
            <button onClick={voiceMode ? stopVoice : toggleVoiceMode}
              className={`${styles.iconBtn} ${voiceMode ? styles.iconBtnOn : ""}`}
              title={voiceMode ? "Stop voice mode" : "Start voice conversation"}>
              {voiceMode ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
            <button onClick={() => send()} disabled={!input.trim() || loading} className={styles.sendBtn}>
              {loading ? <Loader2 size={14} className={styles.spin} /> : <Send size={14} />}
            </button>
          </div>
        </div>
      )}

      {/* Trigger */}
      <button onClick={() => setIsOpen(v => !v)}
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ""}`}
        aria-label="AI Health Assistant">
        {isOpen ? <X size={22} /> : <MessageSquare size={22} />}
        {!isOpen && showBadge && <span className={styles.badge}>1</span>}
        {!isOpen && <span className={styles.pulse} />}
      </button>
    </div>
  );
}
