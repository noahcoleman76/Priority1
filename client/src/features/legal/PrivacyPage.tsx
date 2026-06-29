import { Link } from "react-router-dom";
import priorityLogo from "../../assets/priority1-logo.png";

const SUPPORT_EMAIL = "colemandevelopmentutah@gmail.com";

export const PrivacyPage = () => (
  <main className="legal-page">
    <article className="legal-panel">
      <Link to="/" className="brand legal-brand">
        <img src={priorityLogo} alt="Priority1" />
      </Link>
      <h1>Privacy Policy</h1>
      <p className="muted">Effective date: June 29, 2026</p>

      <h2>Overview</h2>
      <p>
        Priority1 helps you create and access your task lists across multiple devices. Accounts are
        used only to save your lists and sync them when you sign in.
      </p>

      <h2>Information We Collect</h2>
      <p>
        We collect the username, email address, and password you provide when creating an account.
        Passwords are stored as hashed values. We also store the categories, tasks, descriptions,
        ordering, and completion status you add to Priority1.
      </p>

      <h2>How We Use Information</h2>
      <p>
        We use your information to provide the app, authenticate your account, save your tasks, and
        make your lists available on multiple devices. We do not sell your data or use your task data
        for advertising.
      </p>

      <h2>Account Deletion</h2>
      <p>
        You can delete your account in Settings. Deleting your account permanently removes your
        account, categories, active tasks, and completed tasks from Priority1.
      </p>

      <h2>Support and Privacy Requests</h2>
      <p>
        Contact <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> for support, privacy
        questions, or account help.
      </p>

      <div className="legal-links">
        <Link to="/contact">Contact</Link>
        <Link to="/login">Log in</Link>
      </div>
    </article>
  </main>
);
