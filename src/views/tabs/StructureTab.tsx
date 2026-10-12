import { useEffect, useRef, useState } from "react";
import { api, type StructureVersion } from "../../api";
import { ErrorBox, Spinner, errorText } from "../../components/ui";

const TEMPLATE = {
  name: "support-messages",
  questions: {
    intent: {
      type: "choice",
      label: "What does the customer want?",
      options: {
        complaint: { label: "a complaint about something that went wrong" },
        question: { label: "a question asking for information" },
        request: { label: "a request to change or cancel something" },
      },
    },
    urgency: {
      type: "score",
      label: "How urgent is it?",
      options: { low: { label: "no rush" }, medium: { label: "soon" }, high: { label: "urgent, right now" } },
    },
    wants_refund: {
      type: "binary",
      label: "Does the customer want their money back?",
      options: { refund: { label: "I want a refund" } },
      negative: { label: "no money involved" },
    },
  },
};

const pretty = (value: unknown) => JSON.stringify(value, null, 2);

interface Props {
  projectId: number;
  versions: StructureVersion[];
  onSaved: () => Promise<unknown>;
}

export default function StructureTab({ projectId, versions, onSaved }: Props) {
  const latest = versions.at(-1);
  const [source, setSource] = useState(() => pretty(latest?.content ?? TEMPLATE));
  const [viewing, setViewing] = useState<number | null>(latest?.version ?? null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Versions can arrive after first render; show the latest unless the user is editing.
  useEffect(() => {
    if (latest && viewing === null && !dirty) {
      setViewing(latest.version);
      setSource(pretty(latest.content));
    }
  }, [latest, viewing, dirty]);

  function edit(text: string) {
    setSource(text);
    setViewing(null);
    setDirty(true);
  }

  function show(v: StructureVersion) {
    setViewing(v.version);
    setSource(pretty(v.content));
    setDirty(false);
    setError(null);
    setNotice(null);
  }

  async function save() {
    setError(null);
    setNotice(null);
    let content: unknown;
    try {
      content = JSON.parse(source);
    } catch (e) {
      setError(`Not valid JSON: ${errorText(e)}`);
      return;
    }
    setBusy(true);
    try {
      const before = latest?.version;
      const saved = await api.createStructure(projectId, content);
      await onSaved();
      setViewing(saved.version);
      setSource(pretty(saved.content));
      setDirty(false);
      setNotice(
        saved.version === before
          ? `Identical to version ${saved.version}, so nothing new was saved.`
          : `Saved as version ${saved.version}. Options are embedded and ready to classify.`,
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="split" style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 24, alignItems: "start" }}>
      <div className="stack">
        <div className="row between">
          <span className="faint">
            {viewing ? `Version ${viewing}. Edit and save to create a new version.` : "Unsaved draft"}
          </span>
          <div className="row">
            <input ref={fileInput} type="file" accept=".json,application/json" hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) edit((await file.text()).replace(/^﻿/, ""));
                e.target.value = "";
              }} />
            <button className="btn ghost small" onClick={() => fileInput.current?.click()}>Load JSON file</button>
            <button className="btn ghost small" onClick={() => edit(pretty(TEMPLATE))}>Template</button>
          </div>
        </div>
        <textarea className="textarea code" spellCheck={false} value={source}
          onChange={(e) => edit(e.target.value)} />
        <ErrorBox error={error} />
        {notice && <div className="alert ok">{notice}</div>}
        <div className="row">
          <button className="btn primary" disabled={busy} onClick={save}>
            {busy ? <><Spinner /> Embedding options…</> : "Save new version"}
          </button>
        </div>
      </div>

      <aside className="card stack" style={{ padding: 20, gap: 12 }}>
        <h3>Versions</h3>
        {versions.length === 0 && <span className="faint">None yet. Save the editor to create v1.</span>}
        {[...versions].reverse().map((v) => (
          <button key={v.version} className="card link"
            style={{ padding: 12, borderColor: v.version === viewing ? "var(--blue-400)" : undefined }}
            onClick={() => show(v)}>
            <div className="row between">
              <strong>v{v.version}</strong>
              <span className="faint">{new Date(v.created_at).toLocaleDateString()}</span>
            </div>
            <div className="faint" style={{ marginTop: 6 }}>
              {v.questions.map((q) => `${q.id}:${q.type}`).join(" · ")}
            </div>
          </button>
        ))}
      </aside>
    </div>
  );
}
