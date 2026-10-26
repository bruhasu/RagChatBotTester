import { Link } from "react-router-dom";
import { tenant } from "../../tenantConfig.js";
import "./About.css";

export default function About() {
  return (
    <article className="about">
      <h1>About {tenant.shortName}</h1>

      {tenant.about.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      <h2>What our assistant can help with</h2>
      <ul className="about-topics">
        {tenant.topics.map((topic) => (
          <li key={topic}>{topic}</li>
        ))}
      </ul>

      <p className="about-note">
        This business is not real. It was made up for a school project that tests an AI help-desk service.
      </p>

      <Link to="/chat" className="btn btn-primary">Ask a question</Link>
    </article>
  );
}
