// client/src/tenantConfig.js
// ALL branding and text for both fictional businesses lives in this one file.
//
// How to switch tenant:
//   npm run dev:a  -> Tenant A (Bagwis University)   at http://localhost:5173
//   npm run dev:b  -> Tenant B (KahonKo Gadgets)      at http://localhost:5174
// (npm run dev with no letter uses Tenant A.)
//
// NEVER put an API key in this file. Everything here is visible in the browser.

const TENANTS = {
  tenantA: {
    id: "tenantA",
    name: "Bagwis University Help Desk",
    shortName: "Bagwis",
    logo: "/logos/wing.svg",
    colors: {
      primary: "#1B2A4A", // navy
      onPrimary: "#FFFFFF", // text on navy
      accent: "#D4AF37", // gold
      onAccent: "#1B2A4A", // text on gold
      background: "#F7F5EF",
    },
    welcomeTitle: "Mabuhay, Bagwisian! How can we help?",
    welcomeText:
      "Ask about enrollment, grades, scholarships and student services. Answers come straight from the university handbook and policies.",
    chatGreeting: "Hi! I'm the Bagwis Help Desk assistant. Ask me anything about enrollment, grades, or scholarships.",
    chatPlaceholder: "e.g. When does enrollment close?",
    // Replies to "hi", "thanks", "bye" (see detectSmallTalk in chatService.js)
    smallTalk: {
      greeting: "Hi! I'm the Bagwis University Help Desk. Ask me about enrollment, grades, scholarships, or student services.",
      thanks: "You're welcome! Is there anything else you'd like to know about enrollment, grades, scholarships, or student services?",
      goodbye: "Goodbye, and good luck with your studies! Come back anytime you have a question.",
    },
    notFoundReply:
      "Sorry, I couldn't find that in the university's documents. Try asking about enrollment, grades, scholarships, or student services, or email helpdesk@bagwisu.example.",
    errorReply:
      "Sorry, I'm having trouble answering right now. Please try again in a moment. If it keeps happening, email helpdesk@bagwisu.example.",
    sampleQuestions: [
      "When does enrollment close?",
      "What happens to an INC grade?",
      "Who can apply for a scholarship?",
    ],
    about: [
      "Bagwis University is a fictional university created for a school project. \"Bagwis\" is the Filipino word for wing, and its students are called Bagwisians.",
      "The Help Desk answers student questions using the university's own documents: the enrollment and registration policy, the grading and academic policy, the scholarships and financial aid guide, the student services FAQ, and the student handbook.",
    ],
    topics: ["Enrollment and registration", "Grades and academic rules", "Scholarships and financial aid", "Student services"],
    // Login and Signup pages: the ONLY text there that differs per tenant.
    // Layout, fields and buttons are shared (AuthLayout, Login.jsx, Signup.jsx).
    // Accounts are NOT shared: each tenant's backend has its own database (server/auth.js).
    login: {
      welcomeTitle: "Join Our Community.",
      welcomeText: "Excellence, integrity, and service — all in one place.",
      // One short line per carousel slide
      highlights: [
        "Ask about enrollment, grades and scholarships",
        "Answers from official university documents",
        "Type in English, Filipino or Taglish",
      ],
    },
  },

  tenantB: {
    id: "tenantB",
    name: "KahonKo Gadgets Support",
    shortName: "KahonKo Gadgets",
    logo: "/logos/box.svg",
    colors: {
      primary: "#C2410C", // orange (dark enough for white text to be readable)
      onPrimary: "#FFFFFF",
      accent: "#FFFFFF", // white
      onAccent: "#C2410C", // orange text on white
      background: "#FFF7ED",
    },
    welcomeTitle: "Hi! Need help with your order?",
    welcomeText:
      "Ask us about returns, refunds, shipping, warranties, and product specs for our phone cases, chargers, and cables.",
    chatGreeting: "Hello! I'm the KahonKo support assistant. Ask me about returns, shipping, warranties, or our products.",
    chatPlaceholder: "e.g. How many days do I have to return an item?",
    smallTalk: {
      greeting: "Hi! I'm KahonKo Gadgets Support. Ask me about returns, refunds, shipping, warranties, or our products.",
      thanks: "You're welcome! Anything else about your order, shipping, returns, or warranties?",
      goodbye: "Bye! Thanks for shopping with KahonKo Gadgets.",
    },
    notFoundReply:
      "Sorry, I couldn't find that in our store documents. Try asking about returns, shipping, warranties, or product specs, or email support@kahonko.example.",
    errorReply:
      "Sorry, I'm having trouble answering right now. Please try again in a moment. If it keeps happening, email support@kahonko.example.",
    sampleQuestions: [
      "How many days do I have to return an item?",
      "How long does shipping take?",
      "What does the warranty cover?",
    ],
    about: [
      "KahonKo Gadgets is a fictional online shop for phone accessories, created for a school project. \"Kahon\" is the Filipino word for box.",
      "Our support assistant answers customer questions using the shop's own documents: the return and refund policy, the shipping FAQ, the product specs sheet, and the warranty terms.",
    ],
    topics: ["Returns and refunds", "Shipping and delivery", "Warranty claims", "Product specs"],
    login: {
      welcomeTitle: "Welcome, KahonKo shopper!",
      welcomeText: "Orders, returns, and warranties — all in one place.",
      highlights: [
        "Ask about orders, returns and refunds",
        "Answers from our official store policies",
        "Shipping, warranty and product specs in one chat",
      ],
    },
  },
};

const DEFAULT_TENANT = "tenantA";

// Vite's "mode" (tenantA or tenantB) picks the tenant.
export const tenant = TENANTS[import.meta.env.MODE] ?? TENANTS[DEFAULT_TENANT];
