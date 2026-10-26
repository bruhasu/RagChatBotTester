// client/src/homeContent.js
// Text and data for the extra Home page sections. Edit the arrays below.
// Tenant A (Bagwis University) is first, Tenant B (KahonKo Gadgets) is second.
// Tenant A facts come from documents/tenantA/facts.md. Keep them in sync.
// Tenant B dates and contacts are still placeholders.

import {
  BookOpen, ChartColumn, ClipboardList, CreditCard, FileText, GraduationCap, Heart,
  Package, Plug, ShieldCheck, Truck, Undo2,
} from "lucide-react";
import { tenant } from "./tenantConfig.js";

// ===================== Tenant A: Bagwis University =====================

// "Key dates" card. Format: "YYYY-MM-DD". From facts.md section 3 (AY 2026–2027).
// These are the next upcoming deadlines (2nd semester). Update them each semester.
// date: null shows "TODO" on the page so nobody forgets.
const DATES_A = [
  { date: "2026-11-14", label: "2nd sem enrollment closes" },
  { date: "2027-03-20", label: "INC deadline (1st sem INCs)" },
  { date: "2026-10-30", label: "Scholarship applications close (2nd sem)" },
];

// "Browse by topic" cards. "question" is typed into the Chat page when clicked.
// "icon" is a lucide-react icon (https://lucide.dev/icons).
const TOPICS_A = [
  { icon: ClipboardList, title: "Enrollment", description: "Dates, steps and requirements", question: "How do I enroll for next semester?" },
  { icon: ChartColumn, title: "Grades & INC", description: "Grading rules and incomplete grades", question: "What happens if I get an INC grade?" },
  { icon: GraduationCap, title: "Scholarships", description: "Who can apply and how to keep it", question: "Who can apply for a scholarship?" },
  { icon: CreditCard, title: "Tuition & Payments", description: "Fees, installments and refunds", question: "Can I pay my tuition in installments?" },
  { icon: FileText, title: "Registrar Documents", description: "TOR, certificates and requests", question: "How do I request my transcript of records?" },
  { icon: Heart, title: "Student Services", description: "Clinic, counseling and more", question: "What student services are available?" },
  { icon: BookOpen, title: "Library", description: "Hours, borrowing rules and fines", question: "What are the library rules?" },
];

// "Top questions" accordion
const FAQS_A = [
  { question: "When is first-semester enrollment?", answer: "Enrollment for the first semester runs from June 2 to June 20. Bring your admission slip to the Registrar's Office." },
  { question: "What happens to an INC grade?", answer: "An INC must be completed within one semester. If it isn't, it automatically becomes a 0.0 (failed). Grades run from 4.0 (highest) to 1.0 (lowest pass)." },
  { question: "Who can get an academic scholarship?", answer: "Students with a GWA of 3.5 or higher and no grade lower than 2.5 in the previous semester." },
  { question: "When is the Registrar's Office open?", answer: "Monday to Friday, 8:00 AM to 5:00 PM." },
  { question: "How do I request my transcript of records?", answer: "File a request at the Registrar's Office. Processing usually takes 5 to 7 working days." },
];

const CONTENT_A = {
  sourceNote: "Based on the Student Handbook, updated August 1, 2026.",
  askPlaceholder: "e.g. How do I request my TOR?",
  dates: DATES_A,
  topics: TOPICS_A,
  steps: [
    { title: "Ask a question", text: "Type your question in English, Filipino, or Taglish." },
    { title: "Get an answer from the handbook", text: "Answers come from official university documents, with sources shown." },
    { title: "Talk to staff if you need more help", text: "Still stuck? Contact the Help Desk team below." },
  ],
  faqs: FAQS_A,
  // "Need a person?" card. From facts.md section 2 (Help Desk, run by OSA).
  contact: {
    office: "Office of Student Affairs Help Desk, Kalapati Hall Room 201",
    hours: "Monday to Friday, 8:00 AM to 5:00 PM",
    email: "helpdesk@bagwisu.example",
  },
};

// ===================== Tenant B: KahonKo Gadgets =====================

const DATES_B = [
  { date: "2026-11-11", label: "11.11 Sale" },
  { date: "2026-11-27", label: "Black Friday deals" },
  { date: "2026-12-12", label: "12.12 Sale" },
  { date: "2026-12-18", label: "Last day for Christmas delivery" },
];

const TOPICS_B = [
  { icon: Package, title: "Orders", description: "Track, change, or cancel an order", question: "How do I track my order?" },
  { icon: Undo2, title: "Returns & Refunds", description: "How and when you can return items", question: "How many days do I have to return an item?" },
  { icon: Truck, title: "Shipping", description: "Delivery times and fees", question: "How long does shipping take?" },
  { icon: ShieldCheck, title: "Warranty", description: "What's covered and how to claim", question: "What does the warranty cover?" },
  { icon: CreditCard, title: "Payments", description: "Payment options and receipts", question: "What payment methods do you accept?" },
  { icon: Plug, title: "Product Help", description: "Specs, compatibility, and setup", question: "Does the 20W charger work with my phone?" },
];

const FAQS_B = [
  { question: "How many days do I have to return an item?", answer: "You can return an item within 15 days of delivery, as long as it is unused and in its original box." },
  { question: "How long does shipping take?", answer: "Metro Manila orders arrive in 2 to 4 business days. Provincial orders take 5 to 8 business days." },
  { question: "What does the warranty cover?", answer: "Chargers and cables have a 6-month warranty against factory defects. Physical damage is not covered." },
  { question: "Can I change my order after paying?", answer: "Yes, if it hasn't shipped yet. Contact support as soon as possible with your order number." },
  { question: "Does the 20W charger support fast charging?", answer: "Yes. The KahonKo 20W charger supports USB-C Power Delivery." },
];

const CONTENT_B = {
  sourceNote: "Based on our store policies, updated August 1, 2026.",
  askPlaceholder: "e.g. How do I track my order?",
  dates: DATES_B,
  topics: TOPICS_B,
  steps: [
    { title: "Ask a question", text: "Ask about orders, returns, shipping, or products." },
    { title: "Get an answer from our policies", text: "Answers come from our official store documents, with sources shown." },
    { title: "Talk to our team if you need more help", text: "Still stuck? Contact our support team below." },
  ],
  faqs: FAQS_B,
  contact: {
    office: "KahonKo Support Team (online only, no walk-in shop)",
    hours: "Monday to Saturday, 9:00 AM to 6:00 PM",
    email: null, // TODO: real support email
  },
};

const CONTENT = { tenantA: CONTENT_A, tenantB: CONTENT_B };

export const homeContent = CONTENT[tenant.id];
