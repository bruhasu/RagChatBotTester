import "./FaqAccordion.css";

// Each question opens and closes on click. Uses the browser's built-in
// <details>/<summary>, so it works with the keyboard too and needs no extra code.
export default function FaqAccordion({ faqs }) {
  return (
    <div className="faq">
      {faqs.map((faq) => (
        <details key={faq.question} className="faq-item">
          <summary>
            <span>{faq.question}</span>
            <span className="faq-icon" aria-hidden="true">+</span>
          </summary>
          <p>{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}
