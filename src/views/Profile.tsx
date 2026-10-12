import { useEffect, useState, type FormEvent } from "react";
import { api, type User } from "../api";
import { Avatar, displayName } from "../components/UserMenu";
import { ErrorBox, Spinner, errorText } from "../components/ui";

interface Props {
  user: User;
  onUpdated: (user: User) => void;
  onBack: () => void;
  onLogout: () => void;
}

export default function Profile({ user, onUpdated, onBack, onLogout }: Props) {
  const [name, setName] = useState(user.name ?? "");
  const [projects, setProjects] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.projects().then((p) => setProjects(p.length)).catch(() => setProjects(null));
  }, []);

  const dirty = name.trim() !== (user.name ?? "");

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await api.updateMe({ name: name.trim() || null });
      onUpdated(updated);
      setName(updated.name ?? "");
      setSaved(true);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const since = new Date(user.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="page stack" style={{ gap: 32, maxWidth: 720 }}>
      <button className="btn text small" style={{ paddingLeft: 0, alignSelf: "flex-start" }} onClick={onBack}>
        ← All projects
      </button>

      <div className="row" style={{ gap: 24 }}>
        <Avatar user={user} size={88} />
        <div style={{ minWidth: 0 }}>
          <h1>{displayName(user)}</h1>
          <p className="muted ellipsis" style={{ margin: "4px 0 0" }}>{user.email}</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div className="card">
          <span className="faint">Member since</span>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{since}</div>
        </div>
        <div className="card">
          <span className="faint">Projects</span>
          <div className="num" style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>
            {projects === null ? "—" : projects}
          </div>
        </div>
      </div>

      <form className="card stack" onSubmit={save}>
        <h2>Personal info</h2>
        <label className="field">
          <span>Name</span>
          <input className="input" value={name} maxLength={100} placeholder="How should we call you?"
            onChange={(e) => { setName(e.target.value); setSaved(false); }} />
        </label>
        <label className="field">
          <span>Email</span>
          <input className="input" value={user.email} disabled style={{ opacity: 0.6 }} />
        </label>
        <ErrorBox error={error} />
        {saved && <div className="alert ok">Saved.</div>}
        <div className="row">
          <button className="btn primary" disabled={busy || !dirty}>{busy ? <Spinner /> : "Save changes"}</button>
        </div>
      </form>

      <div className="card row between">
        <div>
          <h2>Log out</h2>
          <p className="muted" style={{ margin: "4px 0 0" }}>End your session on this device.</p>
        </div>
        <button className="btn ghost danger" onClick={onLogout}>Log out</button>
      </div>
    </main>
  );
}
