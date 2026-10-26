import "./ContactCard.css";

// Office, hours, and email for people who want a human. A null value shows "TODO".
export default function ContactCard({ contact }) {
  return (
    <dl className="contact-list">
      <div>
        <dt>Office</dt>
        <dd>{contact.office}</dd>
      </div>
      <div>
        <dt>Hours</dt>
        <dd>{contact.hours}</dd>
      </div>
      <div>
        <dt>Email</dt>
        <dd>
          {contact.email ? (
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          ) : (
            <span className="contact-todo">TODO</span>
          )}
        </dd>
      </div>
    </dl>
  );
}
