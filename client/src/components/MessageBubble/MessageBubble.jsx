import "./MessageBubble.css";

// One chat message.
// role: "user" or "bot". Bot messages can show sources and thumbs buttons.
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
                <li key={i}>
                  <span className="bubble-source-doc">📄 {source.document}</span>
                  <span className="bubble-source-tenant">{source.tenant}</span>
                  {source.snippet && <q className="bubble-source-snippet">{source.snippet}</q>}
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
