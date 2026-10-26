import { Link } from "react-router-dom";
import "./TopicGrid.css";

// Grid of clickable topic cards. Clicking one opens Chat with its starter question typed in.
export default function TopicGrid({ topics }) {
  return (
    <ul className="topic-grid">
      {topics.map(({ icon: Icon, ...topic }) => (
        <li key={topic.title}>
          <Link to="/chat" state={{ question: topic.question }} className="card-link topic-card">
            {/* "icon" is a lucide-react component, so it must be drawn as <Icon />, not {icon} */}
            <span className="topic-icon" aria-hidden="true"><Icon /></span>
            <span className="topic-text">
              <span className="topic-title">{topic.title}</span>
              <span className="topic-description">{topic.description}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
