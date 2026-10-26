import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { tenant } from "../../tenantConfig.js";
import { homeContent } from "../../homeContent.js";
import TopicGrid from "../../components/TopicGrid/TopicGrid.jsx";
import ImportantDates from "../../components/ImportantDates/ImportantDates.jsx";
import HowItWorks from "../../components/HowItWorks/HowItWorks.jsx";
import FaqAccordion from "../../components/FaqAccordion/FaqAccordion.jsx";
import ContactCard from "../../components/ContactCard/ContactCard.jsx";
import "./Home.css";

// "user" is the logged-in account ({ name, email }) from App.jsx.
export default function Home({ user }) {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");

  // Open the Chat page and send the question right away ("send: true").
  function ask(text) {
    const query = text.trim();
    if (query) navigate("/chat", { state: { question: query, send: true } });
  }

  function handleSubmit(event) {
    event.preventDefault(); // stop the form from reloading the page
    ask(question);
  }

  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-hero-text">
          {user && <p className="home-greeting">Welcome, {user.name}!</p>}
          <h1>{tenant.welcomeTitle}</h1>
          <p className="home-text">{tenant.welcomeText}</p>
          <p className="home-source">{homeContent.sourceNote}</p>
        </div>

        <div className="home-hero-ask">
          <form className="home-ask" onSubmit={handleSubmit}>
            <label htmlFor="home-ask-input">Ask the help desk</label>
            <div className="home-ask-box">
              <input
                id="home-ask-input"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={tenant.chatPlaceholder}
              />
              <button type="submit" className="btn btn-accent">
                Ask <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>

          <div className="home-try">
            <span>Try:</span>
            {tenant.sampleQuestions.map((q) => (
              <button key={q} type="button" className="home-try-pill" onClick={() => ask(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Wide screens: topics on the left, sidebar on the right. Phones: sidebar below. */}
      <div className="home-body">
        <section className="home-section home-topics">
          <h2>Browse by topic</h2>
          <TopicGrid topics={homeContent.topics} />
        </section>

        <aside className="home-sidebar">
          <section className="home-side-card">
            <h2>Key dates</h2>
            <ImportantDates dates={homeContent.dates} />
          </section>
          <section className="home-side-card">
            <h2>Need a person?</h2>
            <ContactCard contact={homeContent.contact} />
          </section>
        </aside>
      </div>

      <section className="home-section">
        <h2>How it works</h2>
        <HowItWorks steps={homeContent.steps} />
      </section>

      <section className="home-section">
        <h2>Top questions</h2>
        <FaqAccordion faqs={homeContent.faqs} />
      </section>
    </div>
  );
}
