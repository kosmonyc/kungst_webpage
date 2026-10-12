import type { ReactNode } from "react";

export function Spinner() {
  return <span className="spinner" aria-label="loading" />;
}

export function ErrorBox({ error }: { error: string | null }) {
  return error ? <div className="alert" role="alert">{error}</div> : null;
}

export function Bar({ value, dim = false }: { value: number; dim?: boolean }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={dim ? "bar dim" : "bar"}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty stack" style={{ alignItems: "center" }}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export const pct = (x: number) => `${Math.round(x * 100)}%`;

export function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
