import { useState, type FormEvent } from "react";
import { api, setToken, type User } from "../api";
import { Bar, ErrorBox, Spinner, errorText } from "../components/ui";

const DEMO = [
  ["complaint", 0.82],
  ["question", 0.11],
  ["request", 0.05],
  ["praise", 0.02],
] as const;

export default function Auth({ onAuthenticated }: { onAuthenticated: (u: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "register") await api.register(email, password);
      const { access_token } = await api.login(email, password);
      setToken(access_token);
      onAuthenticated(await api.me());
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="hero">
      <section>
        <h1 className="display">
          Classify anything.
          <br />
          <span style={{ color: "var(--blue-400)" }}>No training.</span>
        </h1>
        <p className="muted" style={{ fontSize: 18, maxWidth: 460, marginTop: 20 }}>
          Describe your questions and options in plain words. Kungst embeds them once and
          scores every text against them, in any language.
        </p>
        <div className="hero-art card">
          <span className="faint">“No me llegó el pedido y nadie responde…”</span>
          {DEMO.map(([label, p], i) => (
            <div className="line" key={label}>
              <span style={{ width: 90, fontWeight: i === 0 ? 700 : 400 }}>{label}</span>
              <Bar value={p} dim={i !== 0} />
              <span className="num faint" style={{ width: 36, textAlign: "right" }}>
                {Math.round(p * 100)}%
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ padding: 32 }}>
        <form className="stack" onSubmit={submit} style={{ gap: 20 }}>
          <div className="segmented" role="tablist">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
              Log in
            </button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
              Sign up
            </button>
          </div>
          <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <label className="field">
            <span>Email</span>
            <input className="input" type="email" required autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </label>
          <label className="field">
            <span>Password</span>
            <input className="input" type="password" required minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
          </label>
          <ErrorBox error={error} />
          <button className="btn primary" disabled={busy} style={{ width: "100%" }}>
            {busy ? <Spinner /> : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>
      </section>
    </main>
  );
}
