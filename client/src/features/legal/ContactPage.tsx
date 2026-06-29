import { Link } from "react-router-dom";
import priorityLogo from "../../assets/priority1-logo.png";

const SUPPORT_EMAIL = "colemandevelopmentutah@gmail.com";

export const ContactPage = () => (
  <main className="legal-page">
    <section className="legal-panel">
      <Link to="/" className="brand legal-brand">
        <img src={priorityLogo} alt="Priority1" />
      </Link>
      <h1>Contact</h1>
      <p>
        For Priority1 support, account help, privacy requests, or app feedback, email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
      <p>
        If you cannot access your account or need help with your task lists across devices, include
        the email address on your Priority1 account when you reach out.
      </p>
      <p className="muted">Support is provided by Coleman Development.</p>
      <div className="legal-links">
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/login">Log in</Link>
      </div>
    </section>
  </main>
);
