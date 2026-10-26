import "./ImportantDates.css";

// "2026-11-27" -> "Nov 27, 2026"
// (Split by hand so the day never shifts because of time zones.)
function formatDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// List of label/date rows. A date of null shows "TODO" (not filled in yet).
export default function ImportantDates({ dates }) {
  return (
    <ul className="dates-list">
      {dates.map((item) => (
        <li key={item.label} className="dates-row">
          <span className="dates-label">{item.label}</span>
          {item.date ? (
            <time dateTime={item.date} className="dates-date">{formatDate(item.date)}</time>
          ) : (
            <span className="dates-date dates-todo">TODO</span>
          )}
        </li>
      ))}
    </ul>
  );
}
