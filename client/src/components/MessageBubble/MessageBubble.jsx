import "./MessageBubble.css";

// Real document ids are long codes (83ac4d53-4317-...). Show only the first part.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i;
function shortDocId(id) {
  const text = String(id ?? "unknown");
  return UUID_PATTERN.test(text) ? `${text.slice(0, 8)}…` : text;
}

// One chat message.
// role: "user" or "bot". Bot messages can show sources and thumbs buttons.
// sources: [{ document_id, chunk_id, score }]. Source 1 is what "[1]" in the answer points to.
// feedback: null, "up" or "down". onFeedback: called with "up" or "down".
export default function MessageBubble({ role, text, sources = [], feedback, onFeedback, typing = false }) {
  return (
    <div className={`bubble-row bubble-row-${role}`}>
      <div className={`bubble bubble-${role}${typing ? " bubble-typing" : ""}`}>
        <p className="bubble-text">{text}</p>

        {sources.length > 0 && (
          <div className="bubble-sources">
            <span className="bubble-sources-title">Sources</span>
            <ul>
              {sources.map((source, i) => (
                <li key={i} title={`Document ${source.document_id}, part ${source.chunk_id}`}>
                  <span className="bubble-source-num">[{i + 1}]</span>
                  <span className="bubble-source-doc">📄 Document {shortDocId(source.document_id)}</span>
                  <span className="bubble-source-meta">
                    part {source.chunk_id}
                    {typeof source.score === "number" && ` · ${Math.round(source.score * 100)}% match`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {onFeedback && (
          <div className="bubble-feedback">
            <span>Was this helpful?</span>
            <button
              type="button"
              aria-label="Helpful"
              aria-pressed={feedback === "up"}
              onClick={() => onFeedback("up")}
            >
              👍
            </button>
            <button
              type="button"
              aria-label="Not helpful"
              aria-pressed={feedback === "down"}
              onClick={() => onFeedback("down")}
            >
              👎
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
