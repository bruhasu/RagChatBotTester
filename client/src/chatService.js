// client/src/chatService.js
// The ONLY file that knows where chat replies come from.
// Right now it makes FAKE replies, so the site works without the backend.
// Later, replace getAnswer and sendFeedback with the real versions at the
// bottom of this file. The Chat page won't need to change.
//
// sendMessage always answers something: small talk ("hi", "thanks", "bye") is
// answered here, and empty answers, errors and timeouts get a friendly message.
//
// Reply shape (same as the mock router):
//   { answer: "...", sources: [{ tenant, document, snippet }], session_id }
// plus smallTalk: true or error: true when the reply did not come from the documents.

import { tenant } from "./tenantConfig.js";

// One random id per browser visit (the PDF asks for this). sessionStorage keeps it
// while the tab is open and forgets it when the tab is closed.
export function getSessionId() {
  try {
    let id = sessionStorage.getItem("sessionId");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("sessionId", id);
    }
    return id;
  } catch {
    return "no-storage-session";
  }
}

// ---------- Small talk ----------
// A message counts as small talk only if it has nothing else in it, so
// "hi, when does enrollment close?" is still sent as a real question.

const SMALL_TALK = {
  greeting: [
    "hi", "hello", "hey", "hiya", "yo", "good morning", "good afternoon", "good evening", "good day",
    "kumusta", "kamusta", "musta", "magandang umaga", "magandang hapon", "magandang gabi",
  ],
  thanks: ["thanks", "thank you", "thank u", "thanks a lot", "ty", "salamat", "maraming salamat"],
  goodbye: ["bye", "goodbye", "bye bye", "see you", "see ya", "paalam", "ingat"],
};
// Extra words allowed around small talk, e.g. "hello po", "thanks for the help".
const FILLER = ["there", "po", "everyone", "bot", "so", "much", "very", "ka", "kayo",
  "again", "for", "the", "help", "and", "oh", "ok", "okay", "later"];

// Returns "greeting", "thanks", "goodbye", or null for a normal question.
export function detectSmallTalk(query) {
  // lowercase, keep only letters, single spaces: "Hi!! 👋" -> "hi"
  let text = query.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
  let kind = null;
  for (const [type, phrases] of Object.entries(SMALL_TALK)) {
    // Longest first, so "thank you" is removed as one phrase.
    for (const phrase of [...phrases].sort((a, b) => b.length - a.length)) {
      const pattern = new RegExp(`\\b${phrase}\\b`, "g");
      if (pattern.test(text)) {
        text = text.replace(pattern, " ");
        kind ??= type;
      }
    }
  }
  const leftover = text.split(" ").filter((word) => word && !FILLER.includes(word));
  return kind && leftover.length === 0 ? kind : null;
}

// ---------- sendMessage: always returns a reply, never throws ----------

const REPLY_TIMEOUT_MS = 30000; // give up waiting after 30 seconds

function makeReply(answer, sources = [], extra = {}) {
  return { answer, sources, session_id: getSessionId(), ...extra };
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`No reply after ${ms} ms`)), ms)),
  ]);
}

export async function sendMessage(query) {
  const smallTalk = detectSmallTalk(query);
  if (smallTalk) {
    return makeReply(tenant.smallTalk[smallTalk], [], { smallTalk: true });
  }

  try {
    const reply = await withTimeout(getAnswer(query), REPLY_TIMEOUT_MS);
    const answer = typeof reply?.answer === "string" ? reply.answer.trim() : "";
    if (!answer) {
      // The router sent nothing useful: say "not found" instead of showing a blank bubble.
      return makeReply(tenant.notFoundReply);
    }
    return makeReply(answer, Array.isArray(reply.sources) ? reply.sources : []);
  } catch (err) {
    console.error("Chat request failed:", err);
    return makeReply(tenant.errorReply, [], { error: true });
  }
}

// ---------- FAKE replies (delete this section when the backend is connected) ----------

const FAKE_ANSWERS = {
  tenantA: [
    {
      keywords: ["enroll", "register", "registration"],
      answer: "Enrollment for the second semester runs from Oct 26 to Nov 3. Bring your admission slip to the Registrar's Office (Admin Building, Room 101).",
      document: "Enrollment and Registration Policy.pdf",
      snippet: "Section 2.1: First-semester enrollment opens Oct 16 and closes Nov 3.",
    },
    {
      keywords: ["grade", "inc", "gwa", "fail"],
      answer: "Grades go from 4.0 (highest) down to 1.0 (lowest passing grade). 0.0 means failed. An INC (incomplete) grade must be completed within one semester. If not, it automatically becomes a 0.0.",
      document: "Grading and Academic Policy.pdf",
      snippet: "Section 4.3: Incomplete grades not completed within one semester become 0.0.",
    },
    {
      keywords: ["scholar", "financial", "discount", "tuition"],
      answer: "Academic scholars need a GWA of 3.5 or higher, with no grade lower than 2.5 in the previous semester.",
      document: "Scholarships and Financial Aid.pdf",
      snippet: "Section 1.2: Academic scholarship requires a GWA of 3.5 or higher.",
    },
    {
      keywords: ["registrar", "open", "office", "hours"],
      answer: "The Registrar's Office is open Monday to Friday, 8:00 AM to 5:00 PM.",
      document: "Student Services FAQ.txt",
      snippet: "Q: When is the Registrar open? A: Monday to Friday, 8 AM to 5 PM.",
    },
  ],
  tenantB: [
    {
      keywords: ["return", "refund"],
      answer: "You can return an item within 15 days of delivery, as long as it is unused and in its original box.",
      document: "Return and Refund Policy.pdf",
      snippet: "Section 1: Items may be returned within 15 days of delivery.",
    },
    {
      keywords: ["ship", "deliver", "arrive", "courier"],
      answer: "Metro Manila orders arrive in 2 to 4 business days. Provincial orders take 5 to 8 business days.",
      document: "Shipping FAQ.txt",
      snippet: "Q: How long is delivery? A: Metro Manila 2-4 days, provincial 5-8 days.",
    },
    {
      keywords: ["warranty", "broken", "damaged", "defect"],
      answer: "Chargers and cables have a 6-month warranty against factory defects. Physical damage is not covered.",
      document: "Warranty Terms.pdf",
      snippet: "Section 2: Six-month coverage for factory defects on chargers and cables.",
    },
    {
      keywords: ["charger", "cable", "case", "spec", "watt"],
      answer: "The KahonKo 20W charger supports USB-C Power Delivery and works with most recent phones.",
      document: "Product Specs Sheet.csv",
      snippet: "KK-CHG-20 | 20W | USB-C PD | 1 port",
    },
  ],
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getAnswer(query) {
  await wait(800 + Math.random() * 700); // pretend the server is thinking

  const lower = query.toLowerCase();
  const match = FAKE_ANSWERS[tenant.id].find((item) =>
    item.keywords.some((word) => lower.includes(word))
  );

  if (!match) {
    // Not in the documents: say so, never invent an answer.
    return { answer: tenant.notFoundReply, sources: [] };
  }

  return {
    answer: match.answer,
    sources: [{ tenant: tenant.id, document: match.document, snippet: match.snippet }],
  };
}

export async function sendFeedback({ query, rating }) {
  await wait(200);
  console.log(`[fake feedback] ${rating} for: ${query}`);
  return { ok: true };
}

// ---------- REAL versions (use these once the backend is connected) ----------
//
// (sendMessage above stays as it is. It adds small talk, the timeout and the
// friendly error message around getAnswer.)
//
// async function getAnswer(query) {
//   const res = await fetch("/api/chat", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ query, sessionId: getSessionId() }),
//   });
//   if (!res.ok) throw new Error(`Chat failed (${res.status})`);
//   return res.json();
// }
//
// export async function sendFeedback({ query, rating }) {
//   const res = await fetch("/api/feedback", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ sessionId: getSessionId(), query, rating }),
//   });
//   if (!res.ok) throw new Error(`Feedback failed (${res.status})`);
//   return res.json();
// }
