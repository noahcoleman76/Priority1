import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../../components/Header";
import { api } from "../../api/client";
import { useAuth } from "../auth/AuthContext";
import { accentPresets, useAccent } from "./AccentContext";

export const SettingsPage = () => {
  const { user, updateUser, logout } = useAuth();
  const { accentId, setAccentId } = useAccent();
  const [form, setForm] = useState({
    username: user?.username ?? "",
    email: user?.email ?? "",
    currentPassword: "",
    newPassword: ""
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("");
    setError("");
    try {
      const result = await api.updateAccount({
        username: form.username,
        email: form.email,
        currentPassword: form.currentPassword || undefined,
        newPassword: form.newPassword || undefined
      });
      updateUser(result.user);
      setForm({ ...form, currentPassword: "", newPassword: "" });
      setStatus("Settings saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save settings");
    }
  };

  const deleteAccount = async (event: FormEvent) => {
    event.preventDefault();
    setDeleteError("");

    if (deleteConfirm !== "DELETE") {
      setDeleteError("Type DELETE to confirm account deletion");
      return;
    }

    try {
      await api.deleteAccount({ currentPassword: deletePassword });
      logout();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Unable to delete account");
    }
  };

  return (
    <>
      <Header />
      <main className="page-shell narrow">
        <Link to="/" className="back-link">
          Back
        </Link>
        <h1>Settings</h1>
        <section className="settings-form accent-settings" aria-labelledby="accent-heading">
          <div>
            <h2 id="accent-heading">Accent color</h2>
          </div>
          <div className="accent-grid">
            {accentPresets.map((preset) => (
              <button
                key={preset.id}
                className="accent-option"
                aria-pressed={accentId === preset.id}
                aria-label={`Use ${preset.name} accent color`}
                onClick={() => setAccentId(preset.id)}
                type="button"
              >
                <span
                  className="accent-swatch"
                  style={{
                    background: preset.colors.accent,
                    borderColor: preset.colors.accentStrong
                  }}
                />
              </button>
            ))}
          </div>
        </section>
        <form className="settings-form" onSubmit={submit}>
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
            Current password
            <input
              value={form.currentPassword}
              onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
              type="password"
            />
          </label>
          <label>
            New password
            <input
              value={form.newPassword}
              onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
              type="password"
              minLength={8}
            />
          </label>
          {status && <p className="success">{status}</p>}
          {error && <p className="error">{error}</p>}
          <button className="primary-button" type="submit">
            Save settings
          </button>
        </form>
        <form className="settings-form danger-zone" onSubmit={deleteAccount}>
          <div>
            <h2>Delete account</h2>
            <p className="muted">
              Permanently deletes your account, categories, active tasks, and completed tasks.
            </p>
          </div>
          <label>
            Current password
            <input
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              type="password"
              required
            />
          </label>
          <label>
            Type DELETE
            <input
              value={deleteConfirm}
              onChange={(event) => setDeleteConfirm(event.target.value)}
              required
            />
          </label>
          {deleteError && <p className="error">{deleteError}</p>}
          <button className="danger-button" type="submit">
            Delete account
          </button>
        </form>
      </main>
    </>
  );
};
