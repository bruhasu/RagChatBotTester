// client/src/chatService.js
// The ONLY file that knows where chat replies come from.
// Questions go to OUR backend (/api/chat), which adds the secret API key and asks the
// router (the partner's real service for Tenant A, the mock router for Tenant B).
//
// sendMessage always answers something: small talk ("hi", "thanks", "bye") is
// answered here, and empty answers, errors and timeouts get a friendly message.
//
// Reply shape (the router's, see test1ref.webp):
//   { answer: "... [1]", sources: [{ document_id, chunk_id, score }], session_id, requestId }
// "[1]" in the answer means sources[0]. Plus smallTalk: true or error: true when the
// reply did not come from the documents.

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
    return makeReply(answer, Array.isArray(reply.sources) ? reply.sources : [], { requestId: reply.request_id });
  } catch (err) {
    console.error("Chat request failed:", err);
    return makeReply(tenant.errorReply, [], { error: true });
  }
}

// ---------- Calls to our backend ----------

async function postJson(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed (${res.status})`);
  if (res.status === 204) return { ok: true }; // saved, nothing to read (feedback)
  return res.json();
}

function getAnswer(query) {
  return postJson("/api/chat", { query, sessionId: getSessionId() });
}

// requestId says which answer is being rated (it comes with each chat reply).
export function sendFeedback({ query, rating, requestId }) {
  return postJson("/api/feedback", { sessionId: getSessionId(), requestId, query, rating });
}
