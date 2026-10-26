import "./HowItWorks.css";

// Numbered steps in a row (stacked on phones).
export default function HowItWorks({ steps }) {
  return (
    <ol className="steps">
      {steps.map((step, i) => (
        <li key={step.title} className="step">
          <span className="step-number" aria-hidden="true">{i + 1}</span>
          <span className="step-title">{step.title}</span>
          <span className="step-text">{step.text}</span>
        </li>
      ))}
    </ol>
  );
}
