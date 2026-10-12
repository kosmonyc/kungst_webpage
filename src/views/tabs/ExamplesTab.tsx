import { useEffect, useState, type FormEvent } from "react";
import { api, type Example, type StructureVersion } from "../../api";
import { Empty, ErrorBox, Spinner, errorText } from "../../components/ui";

interface Props {
  projectId: number;
  latest: StructureVersion | null;
}

type Draft = { text: string; answers: Record<string, unknown> };

// Accepts the model repo's cases.jsonl shape ({query, expected}) or {text, answers}.
function parseJsonl(source: string): Draft[] {
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      let row: Record<string, unknown>;
      try {
        row = JSON.parse(line);
      } catch {
        throw new Error(`Line ${i + 1} is not valid JSON`);
      }
      const text = (row.text ?? row.query) as string | undefined;
      const answers = (row.answers ?? row.expected) as Record<string, unknown> | undefined;
      if (!text || !answers) throw new Error(`Line ${i + 1} needs "text" (or "query") and "answers" (or "expected")`);
      return { text, answers };
    });
}

export default function ExamplesTab({ projectId, latest }: Props) {
  const [examples, setExamples] = useState<Example[] | null>(null);
  const [text, setText] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [bulk, setBulk] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.examples(projectId).then(setExamples).catch((e) => setError(errorText(e)));
  }, [projectId]);

  async function add(drafts: Draft[]) {
    setError(null);
    try {
      const created = await api.addExamples(projectId, drafts);
      setExamples((prev) => [...(prev ?? []), ...created]);
      return true;
    } catch (e) {
      setError(errorText(e));
      return false;
    }
  }

  async function addOne(e: FormEvent) {
    e.preventDefault();
    const filled = Object.fromEntries(Object.entries(answers).filter(([, v]) => v !== ""));
    if (Object.keys(filled).length === 0) {
      setError("Pick at least one answer.");
      return;
    }
    if (await add([{ text: text.trim(), answers: filled }])) {
      setText("");
      setAnswers({});
    }
  }

  async function addBulk() {
    let drafts: Draft[];
    try {
      drafts = parseJsonl(bulk);
    } catch (e) {
      setError(errorText(e));
      return;
    }
    if (drafts.length && (await add(drafts))) {
      setBulk("");
      setShowBulk(false);
    }
  }

  async function remove(id: number) {
    try {
      await api.deleteExample(projectId, id);
      setExamples((prev) => prev?.filter((e) => e.id !== id) ?? null);
    } catch (e) {
      setError(errorText(e));
    }
  }

  if (!latest) {
    return <Empty title="Add a structure first"><p className="muted" style={{ margin: 0 }}>Examples are labelled with the structure's questions.</p></Empty>;
  }

  return (
    <div className="stack" style={{ gap: 24 }}>
      <form className="card stack" onSubmit={addOne}>
        <div className="row between">
          <h2>Add a labelled example</h2>
          <button type="button" className="btn ghost small" onClick={() => setShowBulk((v) => !v)}>
            {showBulk ? "Single example" : "Import JSONL"}
          </button>
        </div>

        {showBulk ? (
          <>
            <textarea className="textarea code" style={{ minHeight: 180 }} value={bulk} onChange={(e) => setBulk(e.target.value)}
              placeholder={'{"query": "No me llegó el pedido…", "expected": {"intent": "complaint", "urgency": "high"}}'} />
            <div className="row">
              <button type="button" className="btn primary" disabled={!bulk.trim()} onClick={addBulk}>Import</button>
              <span className="faint">One JSON object per line, the same format as cases.jsonl.</span>
            </div>
          </>
        ) : (
          <>
            <label className="field">
              <span>Text</span>
              <input className="input" required value={text} onChange={(e) => setText(e.target.value)} placeholder="A real message from your data" />
            </label>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
              {latest.questions.map((q) => (
                <label className="field" key={q.id}>
                  <span>{q.id}</span>
                  <select className="select" value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}>
                    <option value="">Not labelled</option>
                    {(q.type === "binary" ? ["yes", "no"] : q.options).map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <div><button className="btn primary">Add example</button></div>
          </>
        )}
      </form>

      <ErrorBox error={error} />

      {examples === null ? (
        <Spinner />
      ) : examples.length === 0 ? (
        <Empty title="No examples yet"><p className="muted" style={{ margin: 0 }}>Add a handful to measure accuracy in Evaluate.</p></Empty>
      ) : (
        <div className="card" style={{ padding: "20px 12px", overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr><th>Text</th><th>Answers</th><th /></tr>
            </thead>
            <tbody>
              {examples.map((e) => (
                <tr key={e.id}>
                  <td style={{ maxWidth: 520 }}>{e.text}</td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      {Object.entries(e.answers).map(([k, v]) => (
                        <span key={k} className="chip"><span className="faint">{k}</span>{String(v)}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn text small danger" onClick={() => remove(e.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="faint" style={{ margin: "12px 12px 0" }}>{examples.length} examples</p>
        </div>
      )}
    </div>
  );
}
