import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import priorityLogo from "../../assets/priority1-logo.png";

export const RegisterPage = () => {
  const { register, user } = useAuth();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to="/" replace />;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await register(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account");
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-panel" onSubmit={submit}>
        <img className="auth-logo" src={priorityLogo} alt="Priority1" />
        <label>
          Username
          <input
            value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
            required
          />
        </label>
        <label>
          Email
          <input
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            type="email"
            required
          />
        </label>
        <label>
          Password
          <input
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            type="password"
            minLength={8}
            required
          />
        </label>
        <label>
          Confirm Password
          <input
            value={form.confirmPassword}
            onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
            type="password"
            minLength={8}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary-button" type="submit">
          Create account
        </button>
        <p className="muted">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </main>
  );
};
