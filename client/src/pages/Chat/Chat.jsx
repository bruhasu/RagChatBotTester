import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MessageBubble from "../../components/MessageBubble/MessageBubble.jsx";
import { sendMessage, sendFeedback } from "../../chatService.js";
import { tenant } from "../../tenantConfig.js";
import "./Chat.css";

let nextId = 1;

export default function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { id: "welcome", role: "bot", text: tenant.chatGreeting },
  ]);
  // From the Home page, a question either arrives typed in (topic cards)
  // or with "send: true" (hero search and "Try:" pills), which sends it right away.
  const startQuestion = location.state?.question ?? "";
  const autoSend = Boolean(location.state?.send);
  const [input, setInput] = useState(autoSend ? "" : startQuestion);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const autoSent = useRef(false);

  // Scroll to the newest message whenever the list changes.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  // Send the Home page question once. The ref stops React's dev mode from sending it twice,
  // and clearing the page state stops a refresh from sending it again.
  useEffect(() => {
    if (autoSend && !autoSent.current) {
      autoSent.current = true;
      ask(startQuestion);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, []);

  function handleSend(event) {
    event.preventDefault(); // stop the form from reloading the page
    ask(input);
  }

  async function ask(text) {
    const query = text.trim();
    if (!query || loading) return;

    setMessages((prev) => [...prev, { id: nextId++, role: "user", text: query }]);
    setInput("");
    setLoading(true);

    try {
      const reply = await sendMessage(query);
      // Greetings and error messages get no thumbs buttons (they aren't answers to rate).
      const rateable = !reply.smallTalk && !reply.error;
      setMessages((prev) => [
        ...prev,
        {
          id: nextId++, role: "bot", text: reply.answer || tenant.errorReply, sources: reply.sources,
          query: rateable ? query : undefined, requestId: reply.requestId, feedback: null,
        },
      ]);
    } catch (err) {
      // sendMessage never throws, but just in case: always show something.
      console.error(err);
      setMessages((prev) => [...prev, { id: nextId++, role: "bot", text: tenant.errorReply }]);
    } finally {
      setLoading(false);
    }
  }

  function handleFeedback(message, rating) {
    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? { ...m, feedback: rating } : m))
    );
    sendFeedback({ query: message.query, rating, requestId: message.requestId }).catch(console.error);
  }

  return (
    <div className="chat">
      <h1 className="chat-title">Chat with {tenant.shortName}</h1>

      <div className="chat-box">
        <div className="chat-messages" aria-live="polite">
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              role={m.role}
              text={m.text}
              sources={m.sources}
              feedback={m.feedback}
              // Only real answers (they have a query) get thumbs buttons
              onFeedback={m.query ? (rating) => handleFeedback(m, rating) : undefined}
            />
          ))}
          {loading && <MessageBubble role="bot" text="typing..." typing />}
          <div ref={bottomRef} />
        </div>

        <form className="chat-form" onSubmit={handleSend}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={tenant.chatPlaceholder}
            maxLength={2000} // the router's limit
            aria-label="Type your question"
            autoFocus
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
